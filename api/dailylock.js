import { createClient } from "@supabase/supabase-js";

// Builds the Daily Lock board: ONE curated set of options per day, shared by every
// user. Server-side because (a) a client fetch of four sports per home visit burns
// Odds API credits, and (b) a global streak leaderboard is only meaningful if
// everyone is choosing from the same board.
//
// Fill is breadth-first: one option per game until games run out, then a second per
// game, and so on. A twelve-game night lands eight different games; a lone Monday
// night football game opens up every market on it (both moneylines, both spread
// sides, over and under) instead of showing a single lonely option.
//
// Idempotent: a board that already exists for the day is left alone unless ?force=1,
// so odds drift can't reshuffle the board out from under people mid-day.

const DL_ANCHOR_MS = Date.UTC(2026, 0, 1, 8, 0, 0); // matches DL_ANCHOR_MS in the client
const DAY_MS = 86400000;
const TARGET_ROWS = 8;
const ODDS_FLOOR = -200; // nothing shorter: no farming a streak on -450 chalk

const SPORTS = [
  { odds: "americanfootball_nfl", app: "nfl" },
  { odds: "americanfootball_ncaaf", app: "ncaaf" },
  { odds: "basketball_nba", app: "nba" },
  { odds: "baseball_mlb", app: "mlb" },
];

const dayOf = (ms) => Math.floor((ms - DL_ANCHOR_MS) / DAY_MS) + 1;

function amNum(o) {
  const n = parseInt(String(o == null ? "" : o).replace(/[^-+0-9]/g, ""), 10);
  return isNaN(n) ? null : n;
}
const amStr = (n) => (n > 0 ? "+" + n : String(n));
function implied(n) {
  if (n == null) return null;
  return n > 0
    ? Math.round((100 / (n + 100)) * 1000) / 10
    : Math.round((-n / (-n + 100)) * 1000) / 10;
}

// Candidates for ONE event, in the order we'd like to hand them out. Moneylines
// first (the cleanest read), then spreads, then totals — so the wide-slate board is
// mostly moneylines and the deep single-game board fans out through every market.
function candidatesOf(ev, appSport) {
  const home = ev.home_team, away = ev.away_team;
  const game = away + " @ " + home;
  const bk = (ev.bookmakers || [])[0];
  if (!bk) return [];
  const byKey = {};
  for (const mk of bk.markets || []) {
    if (!["h2h", "spreads", "totals"].includes(mk.key)) continue;
    byKey[mk.key] = mk.outcomes || [];
  }
  const out = [];
  const push = (mkKey, o) => {
    const n = amNum(o.price);
    if (n == null || n < ODDS_FLOOR) return;
    const point = o.point != null ? o.point : null;
    let pick;
    if (mkKey === "h2h") pick = o.name;
    else if (mkKey === "spreads") pick = o.name + " " + (point >= 0 ? "+" + point : String(point));
    else pick = o.name + " " + point; // "Over 8.5"
    out.push({
      sport: appSport, event_id: ev.id, game, game_date: ev.commence_time,
      market_key: mkKey, pick_name: pick, outcome: o.name, outcome_point: point,
      odds: amStr(n), implied_odds: implied(n),
      sel_key: ev.id + "|" + mkKey + "|" + o.name + "|" + (point != null ? point : ""),
    });
  };
  for (const k of ["h2h", "spreads", "totals"]) {
    for (const o of byKey[k] || []) push(k, o);
  }
  return out;
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).json({ error: "CRON_SECRET not set" }); // fail CLOSED
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const SB_URL = process.env.VITE_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ODDS_KEY = process.env.ODDS_API_KEY;
  if (!SB_URL || !SB_KEY || !ODDS_KEY) return res.status(500).json({ error: "env not set" });
  const supabase = createClient(SB_URL, SB_KEY);

  const force = String(req.query.force || "") === "1";

  try {
    const now = Date.now();
    const day = dayOf(now);
    const dayEnd = DL_ANCHOR_MS + day * DAY_MS;

    const { data: existing } = await supabase
      .from("daily_lock_board").select("id").eq("day", day).limit(1);
    if (existing && existing.length && !force) {
      return res.status(200).json({ ok: true, day, skipped: "board already built" });
    }

    // Every game starting between now and the end of today's Daily Lock window.
    const events = [];
    for (const sp of SPORTS) {
      try {
        const url =
          "https://api.the-odds-api.com/v4/sports/" + sp.odds +
          "/odds/?apiKey=" + ODDS_KEY +
          "&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso" +
          "&commenceTimeFrom=" + new Date(now).toISOString().replace(/\.\d+Z$/, "Z") +
          "&commenceTimeTo=" + new Date(dayEnd).toISOString().replace(/\.\d+Z$/, "Z");
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        (data || []).forEach((ev) => events.push({ ev, app: sp.app }));
      } catch (e) {}
    }
    if (!events.length) {
      return res.status(200).json({ ok: true, day, rows: 0, note: "no games in window" });
    }

    // Earliest games first, so a wide board reads chronologically.
    events.sort((a, b) => Date.parse(a.ev.commence_time) - Date.parse(b.ev.commence_time));
    const perGame = events.map(({ ev, app }) => candidatesOf(ev, app)).filter((c) => c.length);
    if (!perGame.length) {
      return res.status(200).json({ ok: true, day, rows: 0, note: "no qualifying prices" });
    }

    // Breadth-first: round 0 takes each game's first option, round 1 the second, etc.
    const rows = [];
    const deepest = Math.max(...perGame.map((c) => c.length));
    for (let round = 0; round < deepest && rows.length < TARGET_ROWS; round++) {
      for (const cands of perGame) {
        if (rows.length >= TARGET_ROWS) break;
        if (cands[round]) rows.push({ ...cands[round], day, ord: rows.length });
      }
    }

    await supabase.from("daily_lock_board").delete().eq("day", day);
    const { error } = await supabase.from("daily_lock_board").insert(rows);
    if (error) {
      console.error("[dailylock]", error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({
      ok: true, day, rows: rows.length,
      games: new Set(rows.map((r) => r.event_id)).size,
    });
  } catch (err) {
    console.error("dailylock error", err);
    return res.status(500).json({ error: "dailylock failed" });
  }
}
