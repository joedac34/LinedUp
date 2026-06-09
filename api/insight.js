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
async function espnGameStats(sport, ctx) {
  const em = ESPN_MAP[sport]; if (!em) return { lines: [] };
  const { away, home } = parseGameTeams(ctx.game);
  const pickHint = teamHintFromSelection(ctx.selection);
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
      gs.push({ date: e.date || "", home: me.homeAway === "home", win: me.winner === true || pf > pa, pf, pa, opp: opp?.team?.displayName || "" });
    }
    gs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return gs;
  };
  const summarize = (teamName) => {
    const gs = collect(teamName).slice(0, sport === "nfl" ? 12 : 15);
    if (!gs.length) return null;
    const n = gs.length, w = gs.filter(g => g.win).length;
    const rec = (arr) => `${arr.filter(g => g.win).length}-${arr.length - arr.filter(g => g.win).length}`;
    const avg = (arr, k) => arr.length ? arr.reduce((s, g) => s + g[k], 0) / arr.length : 0;
    let streak = 0; for (const g of gs) { if (g.win === gs[0].win) streak++; else break; }
    const pf = avg(gs, "pf"), pa = avg(gs, "pa");
    return { n, overall: `${w}-${n - w}`, home: rec(gs.filter(g => g.home)), away: rec(gs.filter(g => !g.home)),
      pf: pf.toFixed(1), pa: pa.toFixed(1), margin: pf - pa, streak: streak > 1 ? `${gs[0].win ? "W" : "L"}${streak}` : null, games: gs };
  };
  let pickIsHome, pickName, oppName;
  if (ctx.betType === "ou") { pickIsHome = true; pickName = home; oppName = away; }
  else {
    pickIsHome = nameMatch(normName(pickHint), normName(home));
    pickName = pickIsHome ? home : (nameMatch(normName(pickHint), normName(away)) ? away : pickHint);
    oppName = pickIsHome ? away : home;
  }
  const lines = [];
  const me = summarize(pickName);
  if (me) {
    lines.push({ value: me.overall, label: `Record (last ${me.n})` });
    lines.push({ value: pickIsHome ? me.home : me.away, label: pickIsHome ? "Home record" : "Away record" });
    if (me.streak) lines.push({ value: me.streak, label: "Current streak" });
    if (ctx.betType === "spread") lines.push({ value: (me.margin >= 0 ? "+" : "") + me.margin.toFixed(1), label: `Avg margin (last ${me.n})` });
    lines.push({ value: me.pf, label: "Scored / game" });
    lines.push({ value: me.pa, label: "Allowed / game" });
    const h2h = me.games.filter(g => nameMatch(normName(g.opp), normName(oppName)));
    if (h2h.length) { const hw = h2h.filter(g => g.win).length; lines.push({ value: `${hw}-${h2h.length - hw}`, label: `H2H (last ${h2h.length})` }); }
  }
  const opp = summarize(oppName);
  if (opp) lines.push({ value: opp.overall, label: `${oppName} (last ${opp.n})` });
  if (ctx.betType === "ou") {
    if (me) lines.push({ value: (parseFloat(me.pf) + parseFloat(me.pa)).toFixed(1), label: `${pickName} games avg total` });
    if (opp) lines.push({ value: (parseFloat(opp.pf) + parseFloat(opp.pa)).toFixed(1), label: `${oppName} games avg total` });
  }
  const note = ctx.betType === "ou"
    ? (home && away ? `Total — ${away} @ ${home}` : "")
    : (pickName ? `${pickName} (${pickIsHome ? "HOME" : "AWAY"}) vs ${oppName}` : "");
  return { lines, note };
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
      const s = await espnGameStats(ctx.sport, ctx);
      if (s && s.lines && s.lines.length) { out.lines.push(...s.lines); out.note = s.note; }
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
  },
  required: ["summary", "keyStats", "trends", "bullCase", "bearCase"],
};

async function generate(ctx, stats) {
  const dataBlock = (stats.lines && stats.lines.length)
    ? stats.lines.map(l => `- ${l.label}: ${l.value}`).join("\n")
    : "(no live stats were available for this selection)";

  const system =
    "You are PickLock AI, a sharp, concise sports-betting analyst. " +
    "Use ONLY the figures in the DATA block — never invent, estimate, or recall numbers from memory. " +
    "If a relevant stat is missing, speak qualitatively and do not state a number. " +
    "The DATA may include recent splits (overall, home, away records), per-game scoring, average margin, head-to-head, and current streak. " +
    "Lead with the figures most relevant to THIS bet: a home team's home record, an away team's away record; for a spread emphasize average margin and scoring; for a total emphasize both teams' combined scoring. " +
    "Do NOT mention against-the-spread (ATS) or cover rates, and never cite any split, streak, or head-to-head that is not present in DATA. " +
    "Write a grounded read (a short paragraph), then a few sentences each for the bull and bear case. " +
    "For keyStats, surface up to 4 of the most relevant figures FROM THE DATA block as {value,label}; if DATA is empty, return an empty keyStats array. " +
    "Be analytical, not a guarantee. This is for entertainment, not financial advice.";

  const user =
    `BET\n- Sport: ${ctx.sport}\n- Type: ${ctx.betType}\n- Selection: ${ctx.selection}` +
    (ctx.line != null ? `\n- Line: ${ctx.line}` : "") +
    (ctx.odds ? `\n- Odds: ${ctx.odds}` : "") +
    (ctx.game ? `\n- Game: ${ctx.game}` : "") +
    (stats.note ? `\n- Context: ${stats.note}` : "") +
    `\n\nDATA\n${dataBlock}` +
    (ctx.question ? `\n\nUSER QUESTION\n${ctx.question}` : "");

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
    const key = hashKey([ctx.sport, ctx.betType, ctx.selection, ctx.line, ctx.game, ctx.question || "", day].join("|"));

    const cached = await getCached(key);
    if (cached) return res.status(200).json({ ...cached, cached: true });

    const stats = await fetchSportsData(ctx);
    const out = await generate(ctx, stats);
    await storeCache(key, out);

    return res.status(200).json({ ...out, cached: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}