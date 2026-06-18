// api/closing.js — Closing Line Value pipeline.
//
// Designed for a FREQUENT cron (Vercel Pro per-minute). Each run:
//   1. Snapshots the current best line for UPCOMING events (overwrites by sel_key),
//      so the last snapshot before kickoff becomes the "closing" line.
//   2. Computes CLV onto pending picks whose game has already started (line final).
//
// Add to vercel.json (requires Vercel Pro for sub-daily schedules):
//   { "crons": [ { "path": "/api/closing", "schedule": "* * * * *" } ] }
//
// Env (already set): VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, ODDS_API_KEY

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ODDS_KEY = process.env.ODDS_API_KEY;
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

const SPORT_KEYS = { nfl: "americanfootball_nfl", nba: "basketball_nba", mlb: "baseball_mlb" };

function impliedFromAmerican(a) { a = Number(a); return a > 0 ? 100 / (a + 100) : (-a) / ((-a) + 100); }
function bestPrice(a, b) { if (!a) return b; if (!b) return a; return b.price > a.price ? b : a; }

async function sbGet(path) { const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders }); return r.ok ? r.json() : null; }
async function sbPatch(path, body) { const r = await fetch(`${SB_URL}/rest/v1/${path}`, { method: "PATCH", headers: sbHeaders, body: JSON.stringify(body) }); return r.ok; }
async function sbUpsert(table, rows) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(rows) });
  return r.ok;
}
// Insert-once: keep the FIRST row per unique key (opening line), ignore later snapshots.
async function sbInsertIgnore(table, rows) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbHeaders, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify(rows) });
  return r.ok;
}

async function snapshotSport(sportId) {
  const sk = SPORT_KEYS[sportId]; if (!sk) return { sport: sportId, n: 0, err: "no sport key" };
  // The Odds API requires seconds-precision ISO8601 (NO milliseconds) for commenceTimeFrom.
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const url = `https://api.the-odds-api.com/v4/sports/${sk}/odds/?apiKey=${ODDS_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso&commenceTimeFrom=${now}`;
  let res;
  try { res = await fetch(url); } catch (e) { return { sport: sportId, n: 0, err: "fetch failed: " + e.message }; }
  if (!res.ok) { let t = ""; try { t = (await res.text()).slice(0, 180); } catch {} return { sport: sportId, n: 0, err: `odds ${res.status}: ${t}` }; }
  const games = await res.json();
  const rows = [];
  const nowMs = Date.now();
  const gameCount = Array.isArray(games) ? games.length : 0;
  for (const g of (Array.isArray(games) ? games : [])) {
    if (!g || !g.id) continue;
    if (new Date(g.commence_time).getTime() <= nowMs) continue; // only not-yet-started: keep the latest pre-game line
    const best = {}; // "market|name|point" -> {marketKey,name,point,price}
    for (const bk of (g.bookmakers || [])) {
      for (const mk of (bk.markets || [])) {
        if (!["h2h", "spreads", "totals"].includes(mk.key)) continue;
        for (const oc of (mk.outcomes || [])) {
          const pt = (oc.point != null ? oc.point : "");
          const key = `${mk.key}|${oc.name}|${pt}`;
          best[key] = bestPrice(best[key], { marketKey: mk.key, name: oc.name, point: (oc.point != null ? oc.point : null), price: oc.price });
        }
      }
    }
    const stamp = new Date().toISOString();
    for (const k in best) {
      const o = best[k];
      rows.push({
        sel_key: `${g.id}|${o.marketKey}|${o.name}|${o.point != null ? o.point : ""}`,
        sport: sportId, event_id: g.id, market_key: o.marketKey, outcome: o.name,
        outcome_point: o.point, odds: o.price, implied: Number(impliedFromAmerican(o.price).toFixed(4)),
        commence_time: g.commence_time, captured_at: stamp,
      });
    }
  }
  if (rows.length) {
    await sbUpsert("closing_lines", rows);        // overwrite -> last pre-game = closing
    await sbInsertIgnore("opening_lines", rows);  // keep first -> opening line for movement/sparkline (optional table)
  }
  return { sport: sportId, n: rows.length, games: gameCount };
}

async function applyCLV() {
  // Picks that recorded a selection but haven't been scored for CLV yet.
  const picks = await sbGet(`picks?sel_key=not.is.null&closing_odds=is.null&select=id,sel_key,odds&limit=2000`);
  if (!Array.isArray(picks) || !picks.length) return 0;
  const nowIso = new Date().toISOString();
  let updated = 0;
  for (const p of picks) {
    // Match the closing line for this exact selection, but only once the game has started (line is final).
    const cl = await sbGet(`closing_lines?sel_key=eq.${encodeURIComponent(p.sel_key)}&commence_time=lt.${nowIso}&select=odds,implied&limit=1`);
    if (!Array.isArray(cl) || !cl.length) continue;
    const closeOdds = cl[0].odds;
    const pickImpl = impliedFromAmerican(p.odds);
    const closeImpl = cl[0].implied != null ? Number(cl[0].implied) : impliedFromAmerican(closeOdds);
    const clv = Number(((closeImpl - pickImpl) * 100).toFixed(2)); // positive = beat the close
    if (await sbPatch(`picks?id=eq.${p.id}`, { closing_odds: closeOdds, clv })) updated++;
  }
  return updated;
}

export default async function handler(req, res) {
  if (!ODDS_KEY || !SB_URL) return res.status(500).json({ error: "env not set" });
  try {
    const only = (req.query && req.query.sport) ? [req.query.sport] : ["nfl", "nba", "mlb"];
    let snapshotted = 0;
    const debug = [];
    for (const sp of only) { const r = await snapshotSport(sp); snapshotted += r.n; debug.push(r); }
    const clv_applied = await applyCLV();
    return res.status(200).json({ ok: true, snapshotted, clv_applied, debug });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}