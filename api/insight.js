/**
 * /api/insight.js  —  PickLock AI bet insight
 *
 * Flow:  bet context  ->  pull real stats from SportsDataIO  ->  OpenAI (structured)
 *        ->  { summary, keyStats[], trends[], bullCase, bearCase }
 *
 * Hard rule: the model is told to use ONLY the numbers we hand it. If a stat
 * isn't in the DATA block it must stay qualitative — never invent figures.
 *
 * ── ENV VARS (set in Vercel) ────────────────────────────────────────────────
 *   OPENAI_API_KEY        (new)
 *   SPORTSDATAIO_KEY      (new)
 *   VITE_SUPABASE_URL     (already set — reused for isPro check + cache)
 *   SUPABASE_SERVICE_KEY  (already set)
 *
 * ── OPTIONAL cache table (run once in Supabase; safe no-op if absent) ────────
 *   create table if not exists ai_insights (
 *     cache_key text primary key,
 *     payload   jsonb,
 *     created_at timestamptz default now()
 *   );
 */

import { buildMlbPack } from "./mlbpack.js";

const SB_URL  = process.env.VITE_SUPABASE_URL;
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;
const OPENAI  = process.env.OPENAI_API_KEY;
const SDIO    = process.env.SPORTSDATAIO_KEY;

const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

// ── tiny helpers ─────────────────────────────────────────────────────────────
const num = (x) => { const n = parseFloat(x); return Number.isFinite(n) ? n : null; };
function hashKey(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "ins_" + (h >>> 0).toString(36); }

async function isPro(userId) {
  if (!userId || !SB_URL) return true; // no user passed -> client already gated; don't block
  try {
    const r = await fetch(`${SB_URL}/rest/v1/users?id=eq.${userId}&select=is_pro`, { headers: sbHeaders });
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] && rows[0].is_pro === true;
  } catch { return true; }
}

async function getCached(key) {
  try {
    const cutoff = new Date(Date.now() - 6 * 3600 * 1000).toISOString(); // 6h freshness
    const r = await fetch(`${SB_URL}/rest/v1/ai_insights?cache_key=eq.${key}&created_at=gte.${cutoff}&select=payload`, { headers: sbHeaders });
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0].payload : null;
  } catch { return null; }
}
async function storeCache(key, payload) {
  try {
    await fetch(`${SB_URL}/rest/v1/ai_insights`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ cache_key: key, payload, created_at: new Date().toISOString() }),
    });
  } catch { /* table may not exist yet — fine */ }
}

// ── SportsDataIO stat layer ───────────────────────────────────────────────────
// NOTE: endpoint paths + season strings vary by subscription. Everything below is
// best-effort and wrapped — a wrong path just yields fewer stats, never a crash.
// Verify against your plan at https://sportsdata.io/developers/api-documentation
const SDIO_BASE = "https://api.sportsdata.io/v3";
const LEAGUE = { nfl: "nfl", nba: "nba", mlb: "mlb" };

// market keyword -> SportsDataIO stat field on a player game-log object
const STAT_FIELD = {
  "passing yards": "PassingYards", "pass yds": "PassingYards", "passing touchdowns": "PassingTouchdowns",
  "rushing yards": "RushingYards", "rush yds": "RushingYards", "receiving yards": "ReceivingYards",
  "receptions": "Receptions", "rec": "Receptions",
  "points": "Points", "rebounds": "Rebounds", "reb": "Rebounds", "boards": "Rebounds",
  "assists": "Assists", "ast": "Assists", "3-pointers": "ThreePointersMade", "threes": "ThreePointersMade",
  "steals": "Steals", "blocks": "BlockedShots",
  "hits": "Hits", "home runs": "HomeRuns", "rbis": "RunsBattedIn", "strikeouts": "PitchingStrikeouts",
  "total bases": "TotalBases",
};
function statFieldFor(market) {
  const m = (market || "").toLowerCase();
  for (const k of Object.keys(STAT_FIELD)) if (m.includes(k)) return STAT_FIELD[k];
  return null;
}
async function sdioJSON(url) {
  const sep = url.includes("?") ? "&" : "?";
  const r = await fetch(`${url}${sep}key=${SDIO}`);
  if (!r.ok) throw new Error(`SDIO ${r.status}`);
  return r.json();
}

// Pull a player's recent game logs and compute L10 average + hit-rate vs the line.
async function playerStats(sport, playerName, market, line) {
  const lg = LEAGUE[sport]; const field = statFieldFor(market);
  if (!lg || !playerName) return null;
  try {
    // 1) resolve the player id by name
    const players = await sdioJSON(`${SDIO_BASE}/${lg}/scores/json/Players`); // verify endpoint name for your plan
    const target = playerName.toLowerCase().trim();
    const p = (players || []).find(pl => `${pl.FirstName} ${pl.LastName}`.toLowerCase() === target)
           || (players || []).find(pl => `${pl.FirstName} ${pl.LastName}`.toLowerCase().includes(target));
    if (!p) return null;
    const pid = p.PlayerID;
    const season = new Date().getUTCFullYear(); // adjust to your season string if needed (e.g. "2024REG")
    // 2) recent game logs
    const logs = await sdioJSON(`${SDIO_BASE}/${lg}/stats/json/PlayerGameStatsBySeason/${season}/${pid}/10`);
    const vals = (logs || []).map(g => num(g[field])).filter(v => v !== null);
    if (!vals.length || !field) return { team: p.Team, position: p.Position };
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const overCount = line != null ? vals.filter(v => v > line).length : null;
    return {
      team: p.Team, position: p.Position,
      lines: [
        { value: avg.toFixed(1), label: `${market} / last ${vals.length}` },
        overCount != null ? { value: `${overCount}/${vals.length}`, label: `Over ${line} (last ${vals.length})` } : null,
        { value: String(Math.max(...vals)), label: `High (last ${vals.length})` },
        { value: String(Math.min(...vals)), label: `Low (last ${vals.length})` },
      ].filter(Boolean),
    };
  } catch { return null; }
}

// Pull standings for a team-line bet (record + scoring context).
async function teamStats(sport, teamHint) {
  const lg = LEAGUE[sport];
  if (!lg || !teamHint) return null;
  try {
    const season = new Date().getUTCFullYear();
    const standings = await sdioJSON(`${SDIO_BASE}/${lg}/scores/json/Standings/${season}`);
    const t = (standings || []).find(s => `${s.City} ${s.Name}`.toLowerCase().includes(teamHint.toLowerCase())
                                        || (s.Name || "").toLowerCase().includes(teamHint.toLowerCase()));
    if (!t) return null;
    return { lines: [
      { value: `${t.Wins}-${t.Losses}`, label: "Record" },
      t.ConferenceRank != null ? { value: `#${t.ConferenceRank}`, label: "Conf. rank" } : null,
    ].filter(Boolean) };
  } catch { return null; }
}

// ── ESPN stat layer (free + REAL; ported from grade.js, which grading runs on) ─
// SportsDataIO's FREE TRIAL returns scrambled/fake data, so ESPN is the right
// source for real numbers. Endpoints below are the same ones grade.js uses.
const ESPN_MAP = {
  nfl: { sp: "football",   lg: "nfl" },
  nba: { sp: "basketball", lg: "nba" },
  mlb: { sp: "baseball",   lg: "mlb" },
};
const STAT_ALIASES = {
  "points": ["PTS", "points"], "pts": ["PTS", "points"],
  "rebounds": ["REB", "rebounds"], "reb": ["REB", "rebounds"], "boards": ["REB", "rebounds"],
  "assists": ["AST", "assists"], "ast": ["AST", "assists"], "dimes": ["AST", "assists"],
  "steals": ["STL", "steals"], "stl": ["STL", "steals"],
  "blocks": ["BLK", "blocks"], "blk": ["BLK", "blocks"],
  "turnovers": ["TO", "turnovers"],
  "3-pointers": ["3PT"], "three pointers": ["3PT"], "threes": ["3PT"], "3pt": ["3PT"], "3 pointers": ["3PT"],
  "passing yards": ["YDS", "passingYards"], "pass yds": ["YDS", "passingYards"], "pass yards": ["YDS", "passingYards"],
  "rushing yards": ["YDS", "rushingYards"], "rush yds": ["YDS", "rushingYards"], "rush yards": ["YDS", "rushingYards"],
  "receiving yards": ["YDS", "receivingYards"], "rec yds": ["YDS", "receivingYards"], "rec yards": ["YDS", "receivingYards"],
  "receptions": ["REC", "receptions"], "touchdowns": ["TD"], "tds": ["TD"],
  "strikeouts": ["K", "strikeouts"], "hits allowed": ["H", "hits"], "hits": ["H", "hits"],
  "earned runs": ["ER", "earnedRuns"], "runs allowed": ["R", "runs"], "runs": ["R", "runs"],
  "walks": ["BB", "walks"], "home runs": ["HR", "homeRuns"], "homers": ["HR", "homeRuns"],
  "rbis": ["RBI", "RBIs"], "rbi": ["RBI", "RBIs"],
  "stolen bases": ["SB", "stolenBases"], "stolen base": ["SB", "stolenBases"],
  "doubles": ["2B", "doubles"], "triples": ["3B", "triples"], "total bases": ["TB", "totalBases"],
};
function normName(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}
function resolveStatLabels(statText) {
  const t = (statText || "").toLowerCase();
  const entries = Object.entries(STAT_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [k, labels] of entries) if (t.includes(k)) return labels;
  return [];
}
function statNumber(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  const n = parseFloat(s.includes("-") ? s.split("-")[0] : s);
  return isNaN(n) ? null : n;
}
function parseProp(pickName) {
  const s = (pickName || "").trim(); let m;
  m = s.match(/^(.+?)\s+(over|under)\s+([\d.]+)\s+(.+)$/i);
  if (m) return { player: m[1].trim(), line: parseFloat(m[3]), stat: m[4].trim().toLowerCase() };
  m = s.match(/^(over|under)\s+(.+?)\s+([\d.]+)\s+(.+)$/i);
  if (m) return { player: m[2].trim(), line: parseFloat(m[3]), stat: m[4].trim().toLowerCase() };
  m = s.match(/^(over|under)\s+([\d.]+)\s+(.+)$/i);
  if (m) return { player: null, line: parseFloat(m[2]), stat: m[3].trim().toLowerCase() };
  m = s.match(/^(.+?)\s+([\d.]+)\s*\+\s*(.+)$/);
  if (m) return { player: m[1].trim(), line: parseFloat(m[2]), stat: m[3].trim().toLowerCase() };
  return null;
}
function nameMatch(nm, target) {
  if (!nm || !target) return false;
  if (nm === target || nm.includes(target) || target.includes(nm)) return true;
  const a = nm.split(" "), b = target.split(" ");
  if (a.length && b.length && a[a.length - 1] === b[b.length - 1] && a[0][0] === b[0][0]) return true;
  return false;
}
function dayStr(d) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}
// Pull recent ESPN scoreboard events (parallel day fetches) for a sport.
async function espnEvents(sp, lg, days) {
  const now = Date.now();
  const dates = [];
  for (let i = 0; i < days; i++) dates.push(dayStr(new Date(now - i * 86400000)));
  const out = [], seen = new Set();
  for (let i = 0; i < dates.length; i += 8) {
    const all = await Promise.all(dates.slice(i, i + 8).map(async (day) => {
      try {
        const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/scoreboard?dates=${day}`);
        if (!r.ok) return [];
        return (await r.json()).events || [];
      } catch { return []; }
    }));
    for (const evs of all) for (const e of evs) { if (!seen.has(e.id)) { seen.add(e.id); out.push(e); } }
  }
  return out;
}
// A player's recent stat SERIES -> avg, hit-rate vs line, high/low.
async function espnPlayerSeries(sport, playerName, statText, line) {
  const em = ESPN_MAP[sport]; if (!em) return null;
  const labels = resolveStatLabels(statText); if (!labels.length) return null;
  const target = normName(playerName); if (!target) return null;
  const events = await espnEvents(em.sp, em.lg, 16);
  const ids = events.filter(e => e.status?.type?.completed).map(e => e.id).slice(0, 20);
  const series = [];
  for (let i = 0; i < ids.length; i += 6) {
    const batch = ids.slice(i, i + 6);
    const results = await Promise.all(batch.map(async (id) => {
      try {
        const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${em.sp}/${em.lg}/summary?event=${id}`);
        if (!r.ok) return null;
        return (await r.json()).boxscore?.players || null;
      } catch { return null; }
    }));
    for (const players of results) {
      if (!players) continue;
      for (const teamBlock of players) {
        for (const grp of (teamBlock.statistics || [])) {
          const names = (grp.names || grp.labels || []), keys = (grp.keys || []);
          for (const a of (grp.athletes || [])) {
            if (a.didNotPlay) continue;
            if (!nameMatch(normName(a.athlete?.displayName), target)) continue;
            let val = null;
            for (const lbl of labels) {
              let idx = names.findIndex(n => String(n).toLowerCase() === lbl.toLowerCase());
              if (idx < 0) idx = keys.findIndex(k => String(k).toLowerCase() === lbl.toLowerCase());
              if (idx >= 0 && a.stats && a.stats[idx] != null) { val = statNumber(a.stats[idx]); break; }
            }
            if (val != null) series.push(val);
          }
        }
      }
    }
  }
  if (!series.length) return null;
  const n = series.length, avg = series.reduce((x, y) => x + y, 0) / n;
  const lines = [{ value: avg.toFixed(1), label: `Avg / last ${n}` }];
  if (line != null) lines.push({ value: `${series.filter(v => v > line).length}/${n}`, label: `Over ${line} (last ${n})` });
  lines.push({ value: String(Math.max(...series)), label: `High (last ${n})` });
  lines.push({ value: String(Math.min(...series)), label: `Low (last ${n})` });
  return { lines, note: `${playerName} — last ${n} games (ESPN)` };
}
// A team's recent form (W-L over the last several completed games).
async function espnTeamForm(sport, teamHint) {
  const em = ESPN_MAP[sport]; if (!em || !teamHint) return null;
  const target = normName(teamHint); if (!target) return null;
  const events = await espnEvents(em.sp, em.lg, 24);
  const games = [];
  for (const e of events) {
    if (!e.status?.type?.completed) continue;
    const comp = e.competitions && e.competitions[0]; if (!comp) continue;
    for (const c of (comp.competitors || [])) {
      if (nameMatch(normName(c.team?.displayName || c.team?.name), target)) {
        games.push({ date: e.date || "", win: c.winner === true });
      }
    }
  }
  if (!games.length) return null;
  games.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const recent = games.slice(0, 10);
  const w = recent.filter(g => g.win).length, l = recent.length - w;
  let streak = 0; for (const g of recent) { if (g.win === recent[0].win) streak++; else break; }
  const lines = [{ value: `${w}-${l}`, label: `Last ${recent.length}` }];
  if (streak > 1) lines.push({ value: `${streak}`, label: recent[0].win ? "Win streak" : "Loss streak" });
  return { lines, note: `${teamHint} — recent form (ESPN)` };
}
function parseGameTeams(game) {
  const s = (game || "").trim();
  if (s.includes("@")) { const p = s.split("@"); return { away: p[0].trim(), home: p[1].trim() }; }
  const m = s.split(/\s+(?:vs\.?|at)\s+/i);
  if (m.length === 2) return { away: m[0].trim(), home: m[1].trim() };
  return { away: "", home: "" };
}
// Rich recent stats for a game bet: splits, scoring, margin, streak, head-to-head.
// Accurate SEASON splits (overall / home / road / scoring) for every team.
async function espnStandings(sport) {
  const em = ESPN_MAP[sport]; if (!em) return [];
  let json;
  try { const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${em.sp}/${em.lg}/standings`); if (!r.ok) return []; json = await r.json(); } catch { return []; }
  const list = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node.entries)) {
      for (const e of node.entries) {
        const t = e.team || {}; const stats = {};
        for (const st of (e.stats || [])) { const nm = (st.name || st.type || "").toLowerCase(); if (nm) stats[nm] = st; }
        list.push({ norm: normName(t.displayName || t.name || t.shortDisplayName || ""), abbr: t.abbreviation || "", name: t.displayName || "", stats });
      }
    }
    for (const k in node) { if (k !== "team" && k !== "stats") { const v = node[k]; if (v && typeof v === "object") walk(v); } }
  };
  walk(json);
  return list;
}
function findTeamStanding(list, teamName) {
  const t = normName(teamName); if (!t || !list.length) return null;
  return list.find(e => e.norm && nameMatch(e.norm, t)) || null;
}
function recFromStats(stats) {
  const g = (n) => stats[n];
  const sum = (n) => { const x = g(n); return x ? (x.summary || x.displayValue || null) : null; };
  const val = (n) => { const x = g(n); if (!x) return null; if (x.value != null) return x.value; const f = parseFloat(x.displayValue); return isNaN(f) ? null : f; };
  let overall = sum("overall") || sum("total");
  if (!overall && val("wins") != null && val("losses") != null) overall = `${val("wins")}-${val("losses")}`;
  const home = sum("home");
  const away = sum("road") || sum("away");
  let streak = sum("streak");
  if (streak && /^-?\d+(\.0+)?$/.test(String(streak).trim())) streak = null; // bare number != W/L form
  const gp = val("gamesplayed");
  let scoredPG = val("avgpointsfor"), allowedPG = val("avgpointsagainst");
  if (scoredPG == null && val("pointsfor") != null && gp) scoredPG = val("pointsfor") / gp;
  if (allowedPG == null && val("pointsagainst") != null && gp) allowedPG = val("pointsagainst") / gp;
  return { overall, home, away, streak, scoredPG, allowedPG };
}
async function espnGameStats(sport, ctx) {
  const em = ESPN_MAP[sport]; if (!em) return null;
  const { away, home } = parseGameTeams(ctx.game);
  if (!away && !home) return null;
  const events = await espnEvents(em.sp, em.lg, sport === "nfl" ? 50 : 30);
  const completed = events.filter(e => e.status?.type?.completed);
  const collect = (teamName) => {
    const tnorm = normName(teamName); if (!tnorm) return [];
    const gs = [];
    for (const e of completed) {
      const comp = e.competitions && e.competitions[0]; if (!comp) continue;
      const cs = comp.competitors || [];
      const me = cs.find(c => nameMatch(normName(c.team?.displayName || c.team?.name), tnorm));
      if (!me) continue;
      const opp = cs.find(c => c !== me);
      const pf = parseFloat(me.score), pa = parseFloat(opp?.score);
      if (isNaN(pf) || isNaN(pa)) continue;
      gs.push({ date: e.date || "", win: me.winner === true || pf > pa, pf, pa, home: me.homeAway === "home", opp: opp?.team?.displayName || "", abbr: me.team?.abbreviation || "" });
    }
    gs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return gs;
  };
  const standings = await espnStandings(sport);
  const buildTeam = (teamName) => {
    const gs = collect(teamName).slice(0, sport === "nfl" ? 16 : 20);
    const winAvg = (k) => gs.length ? (gs.reduce((acc, g) => acc + g[k], 0) / gs.length) : null;
    let winStreak = null;
    if (gs.length) { let n = 0; for (const g of gs) { if (g.win === gs[0].win) n++; else break; } if (n > 1) winStreak = `${gs[0].win ? "W" : "L"}${n}`; }
    const st = findTeamStanding(standings, teamName);
    const rec = st ? recFromStats(st.stats) : null;
    const abbr = (st && st.abbr) || (gs[0] && gs[0].abbr) || (teamName || "").split(" ").pop().slice(0, 3).toUpperCase();
    const scored = (rec && rec.scoredPG != null) ? rec.scoredPG.toFixed(1) : (winAvg("pf") != null ? winAvg("pf").toFixed(1) : null);
    const allowed = (rec && rec.allowedPG != null) ? rec.allowedPG.toFixed(1) : (winAvg("pa") != null ? winAvg("pa").toFixed(1) : null);
    return { name: teamName, abbr, overall: (rec && rec.overall) || null, home: (rec && rec.home) || null, away: (rec && rec.away) || null, scored, allowed, streak: (rec && rec.streak) || winStreak || null, _games: gs };
  };
  const awayT = buildTeam(away), homeT = buildTeam(home);
  let h2h = null;
  if (away && home) {
    const hg = awayT._games.filter(g => nameMatch(normName(g.opp), normName(home)));
    if (hg.length) { const w = hg.filter(g => g.win).length; h2h = { label: `H2H (last ${hg.length})`, away: `${w}-${hg.length - w}`, home: `${hg.length - w}-${w}` }; }
  }
  const scoredLabel = sport === "mlb" ? "Runs/game" : "Points/game";
  const allowedLabel = sport === "mlb" ? "Runs allowed/game" : "Points allowed/game";
  const slim = (t) => ({ name: t.name, abbr: t.abbr, overall: t.overall, home: t.home, away: t.away, scored: t.scored, allowed: t.allowed, streak: t.streak });
  const matchup = { away: slim(awayT), home: slim(homeT), scoredLabel, allowedLabel, h2h, title: `${awayT.abbr} @ ${homeT.abbr}` };

  const L = [];
  const push = (lbl, v) => { if (v != null && v !== "") L.push({ label: lbl, value: String(v) }); };
  push(`${awayT.name} season record`, awayT.overall);
  push(`${awayT.name} road record`, awayT.away);
  push(`${homeT.name} season record`, homeT.overall);
  push(`${homeT.name} home record`, homeT.home);
  push(`${awayT.name} ${scoredLabel}`, awayT.scored);
  push(`${awayT.name} ${allowedLabel}`, awayT.allowed);
  push(`${homeT.name} ${scoredLabel}`, homeT.scored);
  push(`${homeT.name} ${allowedLabel}`, homeT.allowed);
  push(`${awayT.name} streak`, awayT.streak);
  push(`${homeT.name} streak`, homeT.streak);
  if (h2h) push(h2h.label, `${awayT.name} ${h2h.away}`);
  const bt = ctx.betType === "ou" ? "total" : (ctx.betType === "spread" ? "spread" : "moneyline");
  return { matchup, lines: L, note: `${awayT.name} @ ${homeT.name} — ${bt}` };
}
function parsePropCtx(ctx) {
  const p = parseProp(ctx.selection || "");
  const player = ctx.player || (p && p.player) || null;
  const stat = ctx.market || (p && p.stat) || ctx.selection || "";
  const line = ctx.line != null ? num(ctx.line) : (p ? p.line : null);
  if (!player) return null;
  return { player, stat, line };
}
function teamHintFromSelection(sel) {
  return (sel || "").replace(/\s*[+-]?\d+(\.\d+)?\s*$/, "").replace(/\bml\b/i, "").trim();
}

async function fetchSportsData(ctx) {
  const out = { lines: [] };
  try {
    if (ctx.betType === "prop") {
      const prop = parsePropCtx(ctx);
      if (prop && prop.player) {
        const s = await espnPlayerSeries(ctx.sport, prop.player, prop.stat, prop.line != null ? prop.line : num(ctx.line));
        if (s && s.lines && s.lines.length) { out.lines.push(...s.lines); out.note = s.note; }
      }
    } else if (ctx.betType === "ml" || ctx.betType === "spread" || ctx.betType === "ou") {
      if (ctx.sport === "mlb") {
        try {
          const mp = await buildMlbPack(ctx);
          if (mp && mp.lines && mp.lines.length) { out.lines.push(...mp.lines); out.note = mp.note; out.matchup = mp.matchup; return out; }
        } catch (e) { /* fall back to ESPN below */ }
      }
      const s = await espnGameStats(ctx.sport, ctx);
      if (s) { if (s.lines && s.lines.length) out.lines.push(...s.lines); if (s.note) out.note = s.note; if (s.matchup) out.matchup = s.matchup; }
    }
  } catch (e) { /* degrade to qualitative; never block the insight */ }
  return out;
}

// ── OpenAI structured generation ──────────────────────────────────────────────
const SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    summary:  { type: "string" },
    keyStats: { type: "array", items: { type: "object", additionalProperties: false,
                  properties: { value: { type: "string" }, label: { type: "string" } }, required: ["value", "label"] } },
    trends:   { type: "array", items: { type: "object", additionalProperties: false,
                  properties: { dir: { type: "string", enum: ["up", "down"] }, text: { type: "string" } }, required: ["dir", "text"] } },
    bullCase: { type: "string" },
    bearCase: { type: "string" },
    yourAngle: { type: "string" },
    conviction: { type: "integer" },
    verdict: { type: "string", enum: ["strong", "lean", "pass", "fade", "none"] },
  },
  required: ["summary", "keyStats", "trends", "bullCase", "bearCase", "yourAngle", "conviction", "verdict"],
};

async function generate(ctx, stats) {
  let system, user;
  const profileBlock = ctx.userStats ? (
    "\n\nPROFILE (the user's own PickLock history — reference when relevant, never invent)\n" +
    `- Archetype: ${ctx.userStats.archetype || "unknown"}\n` +
    `- Overall: ${ctx.userStats.record || "0-0"} (${ctx.userStats.winRate || "—"})` +
    (ctx.userStats.streak ? `, current streak ${ctx.userStats.streak}` : "") +
    (ctx.userStats.byType ? "\n- By bet type: " + Object.entries(ctx.userStats.byType).map(([k, v]) => `${k} ${v.record} (${v.pct}%)`).join(", ") : "") +
    (ctx.userSlot ? `\n- THIS bet type (${ctx.userSlot.label}): ${ctx.userSlot.record} (${ctx.userSlot.pct}%)  <- most relevant` : "")
  ) : "";
  const PERSONAS = {
    sharp: "PERSONA: THE SHARP. Judge this bet purely on price and expected value. You are risk-averse and unsentimental about names or narratives — the number is everything. Pass quickly and often when the edge isn't there, and skew conviction toward sound prices and away from juice. Tone: clipped, no fluff. ",
    degen: "PERSONA: THE DEGEN. You hunt ceiling and upside, weight the size of the payoff heavily, and have a real appetite for plus-money and longshots — while staying honest that variance is high. Skew conviction up on high-payoff spots you can justify from DATA. Tone: high-energy, fearless. ",
    contrarian: "PERSONA: THE CONTRARIAN. You distrust chalk and the popular side. Look for where the crowd is likely overreacting and favor the unpopular side WHEN DATA supports it — never contrarian for its own sake. Tone: skeptical and sharp. ",
    professor: "PERSONA: THE PROFESSOR. Teach as you analyze — briefly explain the WHY: what the key number means, how the line or odds translate to implied probability. Leave the user a little smarter. Tone: clear, patient, instructive. ",
  };
  const personaLine = (ctx.persona && PERSONAS[ctx.persona]) ? PERSONAS[ctx.persona] : "";
  const leagueBlock = ctx.leagueCtx ? (() => {
    const L = ctx.leagueCtx; const lines = [];
    lines.push(`- Format: ${L.format}` + (L.finalWeek ? " (FINAL WEEK)" : (L.weeksLeft != null ? `, ${L.weeksLeft} weeks left` : "")));
    if (L.myRank) lines.push(`- Your rank: #${L.myRank}${L.players ? ` of ${L.players}` : ""}`);
    if (L.leading) lines.push("- You currently lead the league.");
    else if (L.leaderGap != null) lines.push(`- Behind the leader by ${L.leaderGap} pts`);
    if (L.aboveGap != null) lines.push(`- ${L.aboveGap} pts behind the spot directly above`);
    if (L.belowGap != null) lines.push(`- ${L.belowGap} pts ahead of the spot directly below`);
    if (L.opponent) lines.push(`- This week vs ${L.opponent}: ${L.myWeekPts} - ${L.oppWeekPts}` + (L.matchupGap > 0 ? ` (you are UP ${L.matchupGap})` : L.matchupGap < 0 ? ` (you are DOWN ${Math.abs(L.matchupGap)})` : " (even)"));
    return "\n\nLEAGUE (the user's standing/matchup — use for strategy)\n" + lines.join("\n");
  })() : "";
  if (ctx.betType === "chat") {
    system = personaLine +
      "You are Plok, PickLock's friendly betting analyst, chatting with a user. " +
      "You can discuss betting concepts, strategy, how odds / EV / lines work, and how to use the PickLock app. " +
      "In this chat you do NOT have live stats, odds, or injuries for any specific game, so NEVER state a specific stat, line, number, or prediction as fact, and never guess a winner. " +
      "If the user asks who will win, for a number, or for a pick on a real game, tell them you can't pull live data in open chat and point them to: tapping a bet on their board (for a data-backed read of that team or player) or the 'Find a bet' button (for a value scan of a game). " +
      "Be conversational, warm, and concise (2-4 sentences). Screening and education, not betting advice; never suggest stake sizes. " +
      "Put your entire reply in the summary field. Return keyStats and trends as empty arrays, bullCase and bearCase as empty strings, yourAngle as an empty string, conviction as 0, and verdict as 'none'. " +
      "You also have the user's own PickLock history in PROFILE and their standing/matchup in LEAGUE (when present) — you MAY reference their archetype, hot/cold streak, strong/weak bet types, or where they sit in the league to make the chat personal, specific, and strategic.";
    user = `USER MESSAGE\n${ctx.question || ctx.selection}` + profileBlock + leagueBlock;
  } else {
    const dataBlock = (stats.lines && stats.lines.length)
      ? stats.lines.map(l => `- ${l.label}: ${l.value}`).join("\n")
      : "(no live stats were available for this selection)";
    system = personaLine +
      "You are Plok, a sharp, concise sports-betting analyst. " +
      "Use ONLY the figures in the DATA block — never invent, estimate, or recall numbers from memory. If a relevant stat is missing, speak qualitatively without stating a number. " +
      "For a game bet, DATA gives accurate season figures for BOTH teams (records, home/road, per-game scoring and allowed, streak, head-to-head). For a player prop, DATA gives that player's recent game-log stats IF they were found. " +
      "For MLB game bets, DATA may also include each side's league RANKS, the probable starting pitchers' lines, key hitters, injuries, and weather — name the probable starters and weave the most decisive of these into the read. " +
      "Lead the summary with the single most decisive figure for THIS bet, name the team(s) or player, and INTERPRET — do not just list. " +
      "If DATA has no game-log numbers for this player/stat, say plainly that recent game logs for this stat were not available, keep the read brief and qualitative, and do NOT invent or describe metrics (no 'speed', 'matchup dynamics', 'base-running ability' as if measured). " +
      "Do NOT mention against-the-spread (ATS) or cover rates — they are not in DATA. " +
      "BULL and BEAR cases must be SPECIFIC: each cites at least one concrete number from DATA (a record, a per-game figure, the line, or the odds) and ties it to why this side wins or loses. Forbidden filler: 'if they play well', 'momentum', 'anything can happen', 'capable'. Two to three sentences each, no platitudes. If there are genuinely no numbers, keep both cases short and honest rather than padded. " +
      "trends: up to 3 short notes, each anchored to a specific number, or empty if none. " +
      "ALWAYS return keyStats as an EMPTY array — the app renders factual stats separately. Never imply a metric that is not an explicit number in DATA. " +
      "Be analytical, not a guarantee. Entertainment, not financial advice. " +
      "You ALSO have the user's own PickLock betting history in the PROFILE block. Set 'yourAngle' to ONE short, specific sentence connecting THIS bet to their tendencies — especially their record in this exact bet type (the line marked 'most relevant') or their archetype/streak. Be a sharp, encouraging coach: flag when this is a spot they are historically weak or strong. You ALSO have the user's LEAGUE standing/matchup — when it is decisive for THIS bet, make yourAngle strategic: if they are trailing (in the matchup or standings) and this is a high-ceiling or plus-money play, frame it as the variance they need to catch up; if they are leading and this is a safe play, note that it protects the lead; on the FINAL WEEK while behind, push ceiling. Lead yourAngle with whichever of PROFILE or LEAGUE is more decisive for THIS bet. Use ONLY numbers from PROFILE, and return yourAngle as an empty string when PROFILE is absent or nothing is genuinely relevant. " +
      "Finally, give your verdict on taking THIS bet: set 'conviction' to an integer 0-100 for how strong a play it is based ONLY on DATA (records, scoring, line, odds) — be honest and use the full range, not just 50-70. Set 'verdict' to one of: 'strong' (a clear, well-supported play), 'lean' (mild edge), 'pass' (DATA is thin or there is no real edge — tell them to save their slip), or 'fade' (DATA points to the OTHER side). Never manufacture conviction; a real handicapper passes often. If DATA is largely missing, verdict must be 'pass' with low conviction.";
    user =
      `BET\n- Sport: ${ctx.sport}\n- Type: ${ctx.betType}\n- Selection: ${ctx.selection}` +
      (ctx.line != null ? `\n- Line: ${ctx.line}` : "") +
      (ctx.odds ? `\n- Odds: ${ctx.odds}` : "") +
      (ctx.game ? `\n- Game: ${ctx.game}` : "") +
      (stats.note ? `\n- Context: ${stats.note}` : "") +
      `\n- MATCHUP_PROVIDED: ${stats.matchup ? "true" : "false"}` +
      `\n\nDATA\n${dataBlock}` +
      (ctx.question ? `\n\nUSER QUESTION\n${ctx.question}` : "") + profileBlock + leagueBlock;
  }

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 700,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_schema", json_schema: { name: "insight", strict: true, schema: SCHEMA } },
    }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return JSON.parse(data.choices[0].message.content);
}

// ── handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!OPENAI) return res.status(500).json({ error: "OPENAI_API_KEY not set" });

  try {
    const ctx = req.body || {};
    if (!ctx.selection || !ctx.sport) return res.status(400).json({ error: "Missing bet context" });

    if (ctx.userId && !(await isPro(ctx.userId))) {
      return res.status(403).json({ error: "AI insight is a Pro feature" });
    }

    const day = new Date().toISOString().slice(0, 10);
    const leagueSig = ctx.leagueCtx ? `${ctx.leagueCtx.myRank || ""}_${ctx.leagueCtx.matchupGap != null ? Math.round(ctx.leagueCtx.matchupGap) : ""}` : "";
    const key = hashKey(["v6", ctx.sport, ctx.betType, ctx.selection, ctx.line, ctx.game, ctx.question || "", ctx.userId || "", ctx.persona || "", leagueSig, day].join("|"));

    const cached = await getCached(key);
    if (cached) return res.status(200).json({ ...cached, cached: true });

    const stats = await fetchSportsData(ctx);
    const out = await generate(ctx, stats);
    if (stats.matchup) out.matchup = stats.matchup;
    if (ctx.betType === "prop") out.keyStats = (stats.lines && stats.lines.length) ? stats.lines.slice(0, 4) : [];
    await storeCache(key, out);

    return res.status(200).json({ ...out, cached: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}