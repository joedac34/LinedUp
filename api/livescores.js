/**
 * /api/livescores.js
 * Live + recent MLB scores for the row chip (Phase 2) and gamecast sheet (Phase 3).
 * Source: MLB StatsAPI schedule with linescore hydrate — free, no key, no Odds API usage.
 *
 * Returns a NORMALIZED shape (not raw StatsAPI) so the frontend never parses MLB's
 * internals. One call per date covers the live chip AND the full linescore grid.
 *
 * GET /api/livescores?dates=2025-07-08            (single date)
 * GET /api/livescores?dates=2025-07-08,2025-07-09 (slate spanning midnight)
 * Default date = today in America/New_York.
 *
 * Response:
 * {
 *   updatedAt,
 *   games: [{
 *     gamePk, gameDate, state:"pre"|"live"|"final", detail,
 *     away:{name,abbr,score}, home:{name,abbr,score},
 *     inning, half:"Top"|"Middle"|"Bottom"|"End"|null, outs,
 *     bases:{first,second,third},
 *     linescore:{ innings:[{num,a,h}], awayR,awayH,awayE, homeR,homeH,homeE }
 *   }]
 * }
 */

const STAT_URL = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=linescore,team&date=";

function etToday() {
  // YYYY-MM-DD in America/New_York (MLB's operating day)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t)?.value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}

function mapState(abstract, detailed) {
  const a = (abstract || "").toLowerCase();
  const d = (detailed || "").toLowerCase();
  if (a === "final" || /final|game over|completed/.test(d)) return "final";
  if (a === "live" || /in progress|manager|delayed|warmup|replay/.test(d)) return "live";
  return "pre"; // Preview / Scheduled / Pre-Game / Postponed
}

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function normalizeGame(g) {
  const ls = g.linescore || {};
  const at = g.teams?.away || {};
  const ht = g.teams?.home || {};
  const state = mapState(g.status?.abstractGameState, g.status?.detailedState);

  const innings = (ls.innings || []).map((i) => ({
    num: i.num,
    a: i.away && i.away.runs != null ? num(i.away.runs) : null,
    h: i.home && i.home.runs != null ? num(i.home.runs) : null,
  }));

  const off = ls.offense || {};
  return {
    gamePk: g.gamePk,
    gameDate: g.gameDate || null,
    state,
    sport: "mlb",
    detail: g.status?.detailedState || "",
    away: {
      name: at.team?.name || "",
      abbr: at.team?.abbreviation || "",
      score: at.score != null ? num(at.score) : (ls.teams?.away?.runs != null ? num(ls.teams.away.runs) : null),
    },
    home: {
      name: ht.team?.name || "",
      abbr: ht.team?.abbreviation || "",
      score: ht.score != null ? num(ht.score) : (ls.teams?.home?.runs != null ? num(ls.teams.home.runs) : null),
    },
    inning: ls.currentInning != null ? num(ls.currentInning) : null,
    half: ls.inningState || null, // "Top" | "Middle" | "Bottom" | "End"
    outs: ls.outs != null ? num(ls.outs) : null,
    bases: {
      first: !!off.first,
      second: !!off.second,
      third: !!off.third,
    },
    linescore: {
      innings,
      awayR: ls.teams?.away?.runs != null ? num(ls.teams.away.runs) : (at.score != null ? num(at.score) : null),
      awayH: ls.teams?.away?.hits != null ? num(ls.teams.away.hits) : null,
      awayE: ls.teams?.away?.errors != null ? num(ls.teams.away.errors) : null,
      homeR: ls.teams?.home?.runs != null ? num(ls.teams.home.runs) : (ht.score != null ? num(ht.score) : null),
      homeH: ls.teams?.home?.hits != null ? num(ls.teams.home.hits) : null,
      homeE: ls.teams?.home?.errors != null ? num(ls.teams.home.errors) : null,
    },
  };
}

async function fetchDate(date) {
  try {
    const r = await fetch(STAT_URL + encodeURIComponent(date), { headers: { "User-Agent": "PickLock/1.0" } });
    if (!r.ok) return [];
    const data = await r.json();
    const out = [];
    for (const d of (data.dates || [])) {
      for (const g of (d.games || [])) {
        try { out.push(normalizeGame(g)); } catch (e) { /* skip malformed game */ }
      }
    }
    return out;
  } catch (e) {
    return [];
  }
}

// -- ESPN scoreboard (NFL / NCAAF / NBA) -- free, normalized to the MLB shape above.
// Phase A: score chip only, so no per-quarter linescore grid is populated.
const ESPN_SPORTS = {
  nfl:   { sp: "football",   lg: "nfl" },
  ncaaf: { sp: "football",   lg: "college-football" },
  nba:   { sp: "basketball", lg: "nba" },
};
function espnState(state) {
  const t = (state || "").toLowerCase();
  if (t === "post") return "final";
  if (t === "in") return "live";
  return "pre";
}
function normalizeEspnEvent(ev, sport) {
  const comp = (ev.competitions && ev.competitions[0]) || {};
  const cs = comp.competitors || [];
  const home = cs.find((c) => c.homeAway === "home") || cs[0] || {};
  const away = cs.find((c) => c.homeAway === "away") || cs[1] || {};
  const st = ev.status || comp.status || {};
  const stype = st.type || {};
  const nm = (c) => (c.team && (c.team.displayName || c.team.name)) || "";
  const ab = (c) => (c.team && c.team.abbreviation) || "";
  const sc = (c) => { const n = Number(c && c.score); return Number.isFinite(n) ? n : null; };
  // Per-quarter/period scoring (football + basketball) for the gamecast grid.
  const ls = (c) => (c && Array.isArray(c.linescores) ? c.linescores.map((x) => (x && x.value != null ? num(x.value) : null)) : []);
  const awayLS = ls(away), homeLS = ls(home);
  const nper = Math.max(awayLS.length, homeLS.length);
  const periods = [];
  for (let i = 0; i < nper; i++) periods.push({ num: i + 1, a: awayLS[i] != null ? awayLS[i] : null, h: homeLS[i] != null ? homeLS[i] : null });

  // Football live situation: which side has the ball + down & distance.
  let situation = null;
  if (sport === "nfl" || sport === "ncaaf") {
    const sit = comp.situation || {};
    const possId = sit.possession != null ? String(sit.possession) : null;
    const tid = (c) => (c && c.team && c.team.id != null ? String(c.team.id) : null);
    const cid = (c) => (c && c.id != null ? String(c.id) : null);
    const possSide = possId
      ? (possId === tid(home) || possId === cid(home) ? "home"
         : possId === tid(away) || possId === cid(away) ? "away" : null)
      : null;
    situation = {
      possession: possSide,
      downDistance: sit.downDistanceText || sit.shortDownDistanceText || null,
      yardLine: sit.yardLine != null ? num(sit.yardLine) : null,
      isRedZone: !!sit.isRedZone,
      lastPlay: (sit.lastPlay && sit.lastPlay.text) || null,
    };
  }
  return {
    gamePk: "espn-" + sport + "-" + ev.id,
    gameDate: ev.date || null,
    state: espnState(stype.state),
    sport,
    detail: stype.shortDetail || stype.detail || stype.description || "",
    away: { name: nm(away), abbr: ab(away), score: sc(away) },
    home: { name: nm(home), abbr: ab(home), score: sc(home) },
    inning: null, half: null, outs: null,
    bases: { first: false, second: false, third: false },
    period: st.period != null ? num(st.period) : null,
    clock: st.displayClock || null,
    linescore: { innings: [], periods, awayR: sc(away), awayH: null, awayE: null, homeR: sc(home), homeH: null, homeE: null },
    situation,
  };
}
async function fetchEspnDate(sport, date) {
  const cfg = ESPN_SPORTS[sport];
  if (!cfg) return [];
  const ymd = date.replace(/-/g, "");
  try {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${cfg.sp}/${cfg.lg}/scoreboard?dates=${ymd}`, { headers: { "User-Agent": "PickLock/1.0" } });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.events || []).map((ev) => { try { return normalizeEspnEvent(ev, sport); } catch (e) { return null; } }).filter(Boolean);
  } catch (e) {
    return [];
  }
}

export default async function handler(req, res) {
  // Public, read-only, heavily cached at the edge. No secrets, no Odds API.
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");

  let dates = (req.query?.dates || req.query?.date || "").trim();
  let list = dates ? dates.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4) : [etToday()];
  // basic YYYY-MM-DD guard
  list = list.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (!list.length) list = [etToday()];

  const seen = new Set();
  const games = [];
  for (const d of list) {
    const [mlb, nfl, ncaaf, nba] = await Promise.all([
      fetchDate(d),
      fetchEspnDate("nfl", d),
      fetchEspnDate("ncaaf", d),
      fetchEspnDate("nba", d),
    ]);
    for (const g of [...mlb, ...nfl, ...ncaaf, ...nba]) {
      if (g.gamePk != null && seen.has(g.gamePk)) continue;
      if (g.gamePk != null) seen.add(g.gamePk);
      games.push(g);
    }
  }

  const anyLive = games.some((g) => g.state === "live");
  return res.status(200).json({ updatedAt: new Date().toISOString(), dates: list, anyLive, count: games.length, games });
}