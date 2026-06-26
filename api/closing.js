// api/closing.js — Unified line snapshot + Closing Line Value pipeline.
//
// Cost control: this can run on a frequent cron (e.g. every 2–5 min, all sports)
// because it self-throttles the PAID Odds API call:
//   1. FREE /events gate  — never pays unless games are actually upcoming.
//   2. Proximity tiering   — snapshots often near kickoff, rarely when far out.
//   3. The latest snapshot before kickoff becomes the "closing" line, and the
//      same closing_lines rows are the current board the app can read (so user
//      browsing doesn't cost an Odds API call).
// Then it computes CLV onto pending picks whose game has already started.
//
// vercel.json (recommended): { "path": "/api/closing", "schedule": "*/2 * * * *" }
//   — drop the ?sport=mlb so it covers all sports; the gating keeps it cheap.
//
// Env (already set): VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, ODDS_API_KEY, CRON_SECRET

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ODDS_KEY = process.env.ODDS_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

const SPORT_KEYS = { nfl: "americanfootball_nfl", nba: "basketball_nba", mlb: "baseball_mlb" };

// How far out to keep board lines fresh (covers night-before shopping).
const SNAP_WINDOW_H = 48;
// Required minutes between PAID snapshots, keyed to the nearest kickoff.
function requiredGapMin(nearestMin) {
  if (nearestMin < 60) return 5;    // final hour → every ~5 min (defines the closing line)
  if (nearestMin < 720) return 30;  // 1–12h out → every ~30 min
  return 180;                       // 12h+ out (night-before board) → every ~3h
}

// The Odds API wants seconds-precision ISO8601 (no milliseconds).
function isoNow() { return new Date().toISOString().replace(/\.\d{3}Z$/, "Z"); }
function impliedFromAmerican(a) { a = Number(a); return a > 0 ? 100 / (a + 100) : (-a) / ((-a) + 100); }
function bestPrice(a, b) { if (!a) return b; if (!b) return a; return b.price > a.price ? b : a; }

async function sbGet(path) { const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders }); return r.ok ? r.json() : null; }
async function sbPatch(path, body) { const r = await fetch(`${SB_URL}/rest/v1/${path}`, { method: "PATCH", headers: sbHeaders, body: JSON.stringify(body) }); return r.ok; }
async function sbUpsert(table, rows) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(rows) });
  return r.ok;
}
async function sbInsertIgnore(table, rows) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbHeaders, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify(rows) });
  return r.ok;
}

// FREE endpoint — does not count against the Odds API quota.
async function fetchEvents(sk) {
  try {
    const r = await fetch(`https://api.the-odds-api.com/v4/sports/${sk}/events?apiKey=${ODDS_KEY}&dateFormat=iso&commenceTimeFrom=${isoNow()}`);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch (e) { return []; }
}

// When did we last pay for a snapshot of this sport? (free DB read, no new table needed)
async function lastSnapshotAt(sportId) {
  const r = await sbGet(`closing_lines?sport=eq.${sportId}&select=captured_at&order=captured_at.desc&limit=1`);
  return (Array.isArray(r) && r.length) ? r[0].captured_at : null;
}

async function snapshotSport(sportId) {
  const sk = SPORT_KEYS[sportId];
  if (!sk) return { sport: sportId, skipped: "no_sport_key" };

  // 1) FREE gate
  const events = await fetchEvents(sk);
  const nowMs = Date.now();
  const upcoming = events.filter((e) => {
    const t = new Date(e.commence_time).getTime();
    return t > nowMs && t <= nowMs + SNAP_WINDOW_H * 3600 * 1000;
  });
  if (!upcoming.length) return { sport: sportId, skipped: "no_upcoming_games" };

  // 2) Proximity throttle (cadence keyed to the nearest kickoff)
  const nearestMs = Math.min.apply(null, upcoming.map((e) => new Date(e.commence_time).getTime()));
  const nearestMin = Math.floor((nearestMs - nowMs) / 60000);
  const gapMin = requiredGapMin(nearestMin);
  const last = await lastSnapshotAt(sportId);
  if (last && nowMs - new Date(last).getTime() < gapMin * 60000) {
    return { sport: sportId, skipped: "cooldown", nearestMin, gapMin };
  }

  // 3) PAID call — one /odds request returns the whole board for the sport.
  const url = `https://api.the-odds-api.com/v4/sports/${sk}/odds/?apiKey=${ODDS_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso&commenceTimeFrom=${isoNow()}`;
  let resp;
  try { resp = await fetch(url); } catch (e) { return { sport: sportId, err: "fetch_failed: " + e.message }; }
  if (!resp.ok) { let t = ""; try { t = (await resp.text()).slice(0, 160); } catch {} return { sport: sportId, err: `odds_${resp.status}: ${t}` }; }
  const games = await resp.json();

  const rows = [];
  for (const g of (Array.isArray(games) ? games : [])) {
    if (!g || !g.id) continue;
    if (new Date(g.commence_time).getTime() <= nowMs) continue; // only not-yet-started: keep the latest pre-game line
    const best = {}; // "market|name|point" -> { marketKey, name, point, price }
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
    await sbUpsert("closing_lines", rows);       // overwrite by sel_key -> last pre-game = closing line (also the live board)
    await sbInsertIgnore("opening_lines", rows); // keep first -> opening line (optional table, for line-movement)
  }
  return { sport: sportId, paid: true, n: rows.length, nearestMin, gapMin };
}

async function applyCLV() {
  // Picks that recorded a selection but haven't been scored for CLV yet.
  const picks = await sbGet(`picks?sel_key=not.is.null&closing_odds=is.null&select=id,sel_key,odds&limit=2000`);
  if (!Array.isArray(picks) || !picks.length) return 0;

  // Batch-fetch the closing line for every needed sel_key (only games already started,
  // so the line is final). One query per ~60 keys instead of one query per pick.
  const nowIso = isoNow();
  const keys = [...new Set(picks.map((p) => p.sel_key).filter(Boolean))];
  const closeBy = {}; // sel_key -> { odds, implied }
  const CHUNK = 60;
  for (let i = 0; i < keys.length; i += CHUNK) {
    const inList = keys.slice(i, i + CHUNK).map((k) => `"${String(k).replace(/"/g, '""')}"`).join(",");
    const rows = await sbGet(`closing_lines?sel_key=in.(${encodeURIComponent(inList)})&commence_time=lt.${nowIso}&select=sel_key,odds,implied`);
    for (const r of (Array.isArray(rows) ? rows : [])) {
      if (r && r.sel_key && closeBy[r.sel_key] == null) closeBy[r.sel_key] = r;
    }
  }

  let updated = 0;
  for (const p of picks) {
    const cl = closeBy[p.sel_key];
    if (!cl) continue; // no closing line yet (game not started, or a market we don't snapshot e.g. props)
    const closeOdds = cl.odds;
    const pickImpl = impliedFromAmerican(p.odds);
    const closeImpl = cl.implied != null ? Number(cl.implied) : impliedFromAmerican(closeOdds);
    const clv = Number(((closeImpl - pickImpl) * 100).toFixed(2)); // positive = beat the close
    if (await sbPatch(`picks?id=eq.${p.id}`, { closing_odds: closeOdds, clv })) updated++;
  }
  return updated;
}

export default async function handler(req, res) {
  if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!ODDS_KEY || !SB_URL) return res.status(500).json({ error: "env not set" });
  try {
    const only = (req.query && req.query.sport) ? [req.query.sport] : ["nfl", "nba", "mlb"];
    let paid = 0, snapshotted = 0;
    const debug = [];
    for (const sp of only) {
      const r = await snapshotSport(sp);
      debug.push(r);
      if (r.paid) { paid++; snapshotted += (r.n || 0); }
    }
    const clv_applied = await applyCLV();
    return res.status(200).json({ ok: true, paid_calls: paid, snapshotted, clv_applied, debug });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}