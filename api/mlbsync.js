/**
 * /api/mlbsync.js — bank DataFeeds /live box scores into Supabase game logs.
 *
 * Backfill once:   /api/mlbsync?days=30        (last 30 completed days)
 *   or a range:    /api/mlbsync?from=2026-05-18&to=2026-06-16
 * Daily cron:      /api/mlbsync?days=2          (yesterday + day before; catches stat fixes)
 *
 * Idempotent: upserts on (game_id, team_id) / (game_id, player_id), so re-runs are safe.
 *
 * ENV: DATAFEEDS_TOKEN, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

export const maxDuration = 300; // Vercel Pro — a 30-day backfill needs headroom

const TOKEN  = process.env.DATAFEEDS_TOKEN;
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const BASE   = "http://rest.datafeeds.rolling-insights.com/api/v1";
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const numI = (x) => { const v = parseInt(x, 10); return Number.isFinite(v) ? v : 0; };
const qs = (q, k) => (q && q[k] != null ? String(q[k]) : "");

async function sbUpsert(table, rows, onConflict) {
  let done = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const r = await fetch(`${SB_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: { ...sbH, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(chunk),
    });
    if (!r.ok) throw new Error(`SB ${table} ${r.status}: ${(await r.text()).slice(0, 200)}`);
    done += chunk.length;
  }
  return done;
}

// "20260615-12-6" -> { date:"2026-06-15" }
function dateFromGameId(id) {
  const p = String(id).split("-")[0];
  return `${p.slice(0, 4)}-${p.slice(4, 6)}-${p.slice(6, 8)}`;
}

function parseGame(g) {
  if (!g || (g.status !== "completed" && g.game_status !== "Final")) return null;
  const fb = g.full_box; if (!fb || !fb.away_team || !fb.home_team) return null;
  const id = g.game_ID; const game_date = dateFromGameId(id);
  const A = fb.away_team, H = fb.home_team;
  const aInn1 = numI(A.quarter_scores && A.quarter_scores["1"]);
  const hInn1 = numI(H.quarter_scores && H.quarter_scores["1"]);
  const aR = numI(A.score != null ? A.score : (A.team_stats && A.team_stats.R));
  const hR = numI(H.score != null ? H.score : (H.team_stats && H.team_stats.R));

  const teamRows = [
    { game_id: id, team_id: A.team_id, game_date, is_home: false, runs_for: aR, runs_against: hR, inn1_for: aInn1, inn1_against: hInn1, won: aR > hR },
    { game_id: id, team_id: H.team_id, game_date, is_home: true,  runs_for: hR, runs_against: aR, inn1_for: hInn1, inn1_against: aInn1, won: hR > aR },
  ];

  const pmap = {}; // player_id -> merged row (bat + pit in one record)
  const ensure = (pid, teamId, isHome) => {
    if (!pmap[pid]) pmap[pid] = { game_id: id, player_id: numI(pid), game_date, team_id: teamId, is_home: isHome, started: false, inn1_allowed: null, bat: null, pit: null };
    return pmap[pid];
  };
  const pb = g.player_box || {};
  const side = (key, teamId, isHome, oppInn1) => {
    const blk = pb[key]; if (!blk) return;
    for (const [pid, line] of Object.entries(blk.batting || {})) ensure(pid, teamId, isHome).bat = line;
    for (const [pid, line] of Object.entries(blk.pitching || {})) {
      const row = ensure(pid, teamId, isHome);
      row.pit = line;
      const started = line.POS === "S" || line.position_category === "S";
      row.started = started;
      if (started) row.inn1_allowed = oppInn1; // runs the opponent scored in the 1st = what the starter allowed
    }
  };
  side("away_team", A.team_id, false, hInn1); // away starter faces the home lineup in the bottom of the 1st
  side("home_team", H.team_id, true,  aInn1); // home starter faces the away lineup in the top of the 1st

  return { teamRows, playerRows: Object.values(pmap) };
}

function buildDates(q) {
  const out = [];
  const from = qs(q, "from"), to = qs(q, "to");
  if (from && to) {
    let d = new Date(from + "T00:00:00Z"); const end = new Date(to + "T00:00:00Z");
    let guard = 0;
    while (d <= end && guard++ < 400) { out.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); }
    return out;
  }
  const days = Math.min(Math.max(numI(q && q.days) || 2, 1), 40);
  const now = Date.now();
  for (let i = days; i >= 1; i--) out.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  return out;
}

export default async function handler(req, res) {
  if (!TOKEN || !SB_URL || !SB_KEY) return res.status(500).json({ error: "Missing env (DATAFEEDS_TOKEN / VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY)" });
  const dates = buildDates(req.query || {});
  let games = 0; const teamRows = [], playerRows = [];
  const skipped = [];
  for (const d of dates) {
    try {
      const r = await fetch(`${BASE}/live/${d}/MLB?RSC_token=${TOKEN}`);
      if (!r.ok) { skipped.push(`${d}:${r.status}`); await sleep(400); continue; }
      const j = await r.json();
      const arr = j && j.data ? j.data.MLB : null;
      if (!Array.isArray(arr)) { skipped.push(`${d}:shape`); await sleep(400); continue; }
      for (const g of arr) { const p = parseGame(g); if (p) { games++; teamRows.push(...p.teamRows); playerRows.push(...p.playerRows); } }
    } catch (e) { skipped.push(`${d}:err`); }
    await sleep(400);
  }
  let tIns = 0, pIns = 0;
  try {
    tIns = await sbUpsert("mlb_team_logs", teamRows, "game_id,team_id");
    pIns = await sbUpsert("mlb_player_logs", playerRows, "game_id,player_id");
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e), dates: dates.length, games, teamRows: teamRows.length, playerRows: playerRows.length });
  }
  return res.status(200).json({
    ok: true, datesScanned: dates.length, range: [dates[0], dates[dates.length - 1]],
    gamesParsed: games, teamRowsUpserted: tIns, playerRowsUpserted: pIns,
    skipped: skipped.slice(0, 20),
  });
}
