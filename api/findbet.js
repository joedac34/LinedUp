/**
 * /api/findbet.js  —  Plok "find me a bet" value screener (Phase 2)
 *
 * Game lines: de-vig every book -> consensus fair prob -> +EV vs best price.
 * Player props: same de-vig price comparison PLUS a projection model from ESPN
 *   game logs (normal-dist for continuous stats, Poisson for small counts), with
 *   the guardrail safety rails enforced IN CODE: sigma floors, |Z|<=1.5 reality
 *   check, +-8% market reconciliation, and "big edges are bugs" flag. When the
 *   model can't be trusted, it falls back to pure de-vig price comparison.
 *
 * All math is deterministic here; the model only screens, ranks, and explains.
 * ENV: ODDS_API_KEY, OPENAI_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI = process.env.OPENAI_API_KEY;
const ODDS   = process.env.ODDS_API_KEY;

const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
const SPORT_KEYS = { nfl: "americanfootball_nfl", nba: "basketball_nba", mlb: "baseball_mlb" };

const hashKey = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "fb4_" + (h >>> 0).toString(36); };
const amToProb = (o) => (o < 0 ? Math.abs(o) / (Math.abs(o) + 100) : 100 / (o + 100));
const amToDec  = (o) => (o < 0 ? 1 + 100 / Math.abs(o) : 1 + o / 100);
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sampleSD = (a) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1)); };

// ── stats math ───────────────────────────────────────────────────────────────
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const normalCDF = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
function poissonCDF(k, lam) { // P(X <= k)
  if (lam <= 0) return 1;
  let sum = 0, term = Math.exp(-lam);
  for (let i = 0; i <= k; i++) { if (i > 0) term *= lam / i; sum += term; }
  return Math.min(1, sum);
}
function blendMu(series, sport) {
  const all = mean(series);
  const rn = { nba: 5, nfl: 3, mlb: 7 }[sport] || 5;
  const recent = series.slice(0, rn);
  let [Wa, Wb] = ({ nba: [0.7, 0.3], nfl: [0.6, 0.4], mlb: [0.8, 0.2] }[sport]) || [0.7, 0.3];
  if (recent.length < 3) { Wb = Wb / 2; Wa = 1 - Wb; }
  const rMean = recent.length ? mean(recent) : all;
  return all * Wa + rMean * Wb;
}

// ── Supabase (Pro gate + cache) ───────────────────────────────────────────────
async function isPro(userId) {
  if (!userId || !SB_URL) return true;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/users?id=eq.${userId}&select=is_pro`, { headers: sbHeaders });
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] && rows[0].is_pro === true;
  } catch { return true; }
}
async function getCached(key) {
  try {
    const cutoff = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    const r = await fetch(`${SB_URL}/rest/v1/ai_insights?cache_key=eq.${key}&created_at=gte.${cutoff}&select=payload`, { headers: sbHeaders });
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0].payload : null;
  } catch { return null; }
}
async function storeCache(key, payload) {
  try {
    await fetch(`${SB_URL}/rest/v1/ai_insights`, {
      method: "POST", headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ cache_key: key, payload, created_at: new Date().toISOString() }),
    });
  } catch { /* table optional */ }
}

// ── ESPN (game logs for prop projections) ─────────────────────────────────────
const ESPN_MAP = { nfl: { sp: "football", lg: "nfl" }, nba: { sp: "basketball", lg: "nba" }, mlb: { sp: "baseball", lg: "mlb" } };
const STAT_ALIASES = {
  "points": ["PTS", "points"], "rebounds": ["REB", "rebounds"], "assists": ["AST", "assists"],
  "3-pointers": ["3PT"], "passing yards": ["YDS", "passingYards"], "rushing yards": ["YDS", "rushingYards"],
  "receiving yards": ["YDS", "receivingYards"], "receptions": ["REC", "receptions"],
  "strikeouts": ["K", "strikeouts"], "hits": ["H", "hits"],
};
const normName = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
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
function nameMatch(nm, target) {
  if (!nm || !target) return false;
  if (nm === target || nm.includes(target) || target.includes(nm)) return true;
  const a = nm.split(" "), b = target.split(" ");
  if (a.length && b.length && a[a.length - 1] === b[b.length - 1] && a[0][0] === b[0][0]) return true;
  return false;
}
const dayStr = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
async function espnEvents(sp, lg, days) {
  const now = Date.now(), dates = [];
  for (let i = 0; i < days; i++) dates.push(dayStr(new Date(now - i * 86400000)));
  const out = [], seen = new Set();
  for (let i = 0; i < dates.length; i += 8) {
    const all = await Promise.all(dates.slice(i, i + 8).map(async (day) => {
      try { const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/scoreboard?dates=${day}`); if (!r.ok) return []; return (await r.json()).events || []; } catch { return []; }
    }));
    for (const evs of all) for (const e of evs) { if (!seen.has(e.id)) { seen.add(e.id); out.push(e); } }
  }
  return out;
}
// Fetch ~20 recent completed game box scores ONCE; reuse across all players.
async function espnBoxCache(sport) {
  const em = ESPN_MAP[sport]; if (!em) return [];
  const events = await espnEvents(em.sp, em.lg, 16);
  const ids = events.filter(e => e.status?.type?.completed).map(e => e.id).slice(0, 20);
  const boxes = [];
  for (let i = 0; i < ids.length; i += 6) {
    const res = await Promise.all(ids.slice(i, i + 6).map(async (id) => {
      try { const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${em.sp}/${em.lg}/summary?event=${id}`); if (!r.ok) return null; return (await r.json()).boxscore?.players || null; } catch { return null; }
    }));
    for (const p of res) if (p) boxes.push(p); // most-recent first
  }
  return boxes;
}
function seriesFromBox(boxes, player, labels) {
  const target = normName(player), series = [];
  for (const players of boxes) {
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
  return series;
}

// ── Odds ───────────────────────────────────────────────────────────────────
function parseTeams(game) {
  const s = (game || "").trim();
  if (s.includes("@")) { const p = s.split("@"); return { away: p[0].trim(), home: p[1].trim() }; }
  const m = s.split(/\s+(?:vs\.?|at)\s+/i);
  if (m.length === 2) return { away: m[0].trim(), home: m[1].trim() };
  return { away: "", home: "" };
}
function teamMatch(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  return x.split(" ").pop() === y.split(" ").pop();
}
async function fetchGameOdds(sport, ctx) {
  const sk = SPORT_KEYS[sport]; if (!sk || !ODDS) return null;
  const url = `https://api.the-odds-api.com/v4/sports/${sk}/odds?apiKey=${ODDS}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Odds API ${r.status}`);
  const events = await r.json();
  const { home, away } = parseTeams(ctx.game);
  const wantHome = ctx.home || home, wantAway = ctx.away || away;
  return (events || []).find(e =>
    (teamMatch(e.home_team, wantHome) && teamMatch(e.away_team, wantAway)) ||
    (teamMatch(e.home_team, wantAway) && teamMatch(e.away_team, wantHome))
  ) || null;
}

const labelFor = (mkt, name, point) => {
  if (mkt === "h2h") return `${name} ML`;
  if (mkt === "spreads") return `${name} ${point > 0 ? "+" : ""}${point}`;
  if (mkt === "totals") return `${name} ${point}`;
  return name;
};

// Game lines: de-vig each book, consensus fair prob per side, +EV best price.
function analyzeGame(event) {
  const sides = {};
  for (const bk of (event.bookmakers || [])) {
    for (const mk of (bk.markets || [])) {
      const outs = mk.outcomes || [];
      if (outs.length !== 2) continue;
      const probs = outs.map(o => amToProb(o.price));
      const sum = probs[0] + probs[1]; if (!sum) continue;
      outs.forEach((o, i) => {
        const fair = probs[i] / sum, dec = amToDec(o.price);
        const key = `${mk.key}|${o.name}|${o.point != null ? o.point : ""}`;
        if (!sides[key]) sides[key] = { market: mk.key, name: o.name, point: o.point, fairs: [], bestDec: 0, bestBook: "", bestAm: null };
        sides[key].fairs.push(fair);
        if (dec > sides[key].bestDec) { sides[key].bestDec = dec; sides[key].bestBook = bk.title; sides[key].bestAm = o.price; }
      });
    }
  }
  const cands = [];
  for (const k in sides) {
    const s = sides[k];
    if (s.fairs.length < 3) continue;
    const consensus = mean(s.fairs), ev = consensus * s.bestDec - 1;
    cands.push({ kind: "line", label: labelFor(s.market, s.name, s.point), evPct: +(ev * 100).toFixed(1), fairPct: +(consensus * 100).toFixed(1), bestOdds: (s.bestAm > 0 ? "+" : "") + s.bestAm, bestBook: s.bestBook, books: s.fairs.length, suspicious: ev > 0.06 });
  }
  return cands.sort((a, b) => b.evPct - a.evPct);
}

// ── Player props: de-vig + projection model ───────────────────────────────────
const PROP_MARKETS = {
  nba: [
    { key: "player_points", stat: "points", short: "PTS", tier: "normal", floor: 0.30 },
    { key: "player_rebounds", stat: "rebounds", short: "REB", tier: "poisson" },
    { key: "player_assists", stat: "assists", short: "AST", tier: "poisson" },
    { key: "player_threes", stat: "3-pointers", short: "3PM", tier: "poisson" },
  ],
  nfl: [
    { key: "player_pass_yds", stat: "passing yards", short: "PASS YDS", tier: "normal", floor: 0.28 },
    { key: "player_rush_yds", stat: "rushing yards", short: "RUSH YDS", tier: "normal", floor: 0.40 },
    { key: "player_reception_yds", stat: "receiving yards", short: "REC YDS", tier: "normal", floor: 0.40 },
    { key: "player_receptions", stat: "receptions", short: "REC", tier: "poisson" },
  ],
  mlb: [
    { key: "pitcher_strikeouts", stat: "strikeouts", short: "Ks", tier: "poisson" },
    { key: "batter_hits", stat: "hits", short: "H", tier: "poisson" },
  ],
};
async function analyzeProps(sport, eventId) {
  const markets = PROP_MARKETS[sport]; const sk = SPORT_KEYS[sport];
  if (!markets || !eventId || !sk || !ODDS) return [];
  const confByKey = {}; markets.forEach(m => { confByKey[m.key] = m; });
  let ev;
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sk}/events/${eventId}/odds?apiKey=${ODDS}&regions=us&markets=${markets.map(m => m.key).join(",")}&oddsFormat=american`;
    const r = await fetch(url); if (!r.ok) return [];
    ev = await r.json();
  } catch { return []; }

  // Group: market|player|line  ->  {over, under} aggregated across books.
  const groups = {};
  for (const bk of (ev.bookmakers || [])) {
    for (const m of (bk.markets || [])) {
      const conf = confByKey[m.key]; if (!conf) continue;
      const byPP = {};
      for (const o of (m.outcomes || [])) {
        const player = o.description || o.participant || "";
        const side = (o.name || "").toLowerCase().startsWith("o") ? "over" : (o.name || "").toLowerCase().startsWith("u") ? "under" : null;
        if (!player || o.point == null || !side) continue;
        const ppk = `${player}|${o.point}`;
        (byPP[ppk] = byPP[ppk] || {})[side] = o.price;
      }
      for (const ppk in byPP) {
        const pair = byPP[ppk]; if (pair.over == null || pair.under == null) continue;
        const [player, ptStr] = ppk.split("|"); const line = parseFloat(ptStr);
        const po = amToProb(pair.over), pu = amToProb(pair.under), sum = po + pu; if (!sum) continue;
        const gk = `${m.key}|${player}|${line}`;
        if (!groups[gk]) groups[gk] = { market: m.key, player, line, conf, over: { fairs: [], bestDec: 0, bestAm: null, bestBook: "" }, under: { fairs: [], bestDec: 0, bestAm: null, bestBook: "" } };
        const g = groups[gk];
        g.over.fairs.push(po / sum); { const d = amToDec(pair.over); if (d > g.over.bestDec) { g.over.bestDec = d; g.over.bestAm = pair.over; g.over.bestBook = bk.title; } }
        g.under.fairs.push(pu / sum); { const d = amToDec(pair.under); if (d > g.under.bestDec) { g.under.bestDec = d; g.under.bestAm = pair.under; g.under.bestBook = bk.title; } }
      }
    }
  }
  const usable = Object.values(groups).filter(g => g.over.fairs.length >= 3);
  if (!usable.length) return [];

  const boxes = await espnBoxCache(sport); // one heavy ESPN pass, reused for all
  const out = [];
  for (const g of usable) {
    const labels = resolveStatLabels(g.conf.stat);
    const series = labels.length ? seriesFromBox(boxes, g.player, labels) : [];
    let model = null;
    if (series.length >= 5) {
      const mu = blendMu(series, sport);
      if (g.conf.tier === "normal") {
        let sd = sampleSD(series); const floor = (g.conf.floor || 0.3) * mu; if (sd < floor) sd = floor;
        const z = sd ? (mu - g.line) / sd : 99, gap = g.line ? Math.abs(mu - g.line) / g.line : 1;
        if (Math.abs(z) <= 1.5 && gap <= 0.08) model = { pOver: normalCDF(z), mu };
        else model = { invalid: true, mu };
      } else {
        model = { pOver: 1 - poissonCDF(Math.floor(g.line), mu), mu };
      }
    }
    for (const side of ["over", "under"]) {
      const s = g[side]; const consensus = mean(s.fairs);
      let pUsed = consensus, basis = "price";
      if (model && !model.invalid && model.pOver != null) { pUsed = side === "over" ? model.pOver : (1 - model.pOver); basis = "model"; }
      const evNum = pUsed * s.bestDec - 1;
      out.push({
        kind: "prop", market: g.market, tier: g.conf.tier, basis,
        label: `${g.player} ${side === "over" ? "o" : "u"}${g.line} ${g.conf.short}`,
        evPct: +(evNum * 100).toFixed(1), fairPct: +(consensus * 100).toFixed(1),
        modelPct: basis === "model" ? +(pUsed * 100).toFixed(1) : null,
        mu: model && model.mu != null ? +model.mu.toFixed(1) : null, line: g.line,
        bestOdds: (s.bestAm > 0 ? "+" : "") + s.bestAm, bestBook: s.bestBook, books: s.fairs.length,
        suspicious: evNum > 0.06,
      });
    }
  }
  return out.sort((a, b) => b.evPct - a.evPct).slice(0, 6);
}

// ── Plok screening prompt (distilled from the guardrail framework) ────────────
const PLOK_SYSTEM =
  "You are Plok, PickLock's betting analyst. You SCREEN for value; you do not give betting advice, place bets, or suggest stake sizes. " +
  "Cite only figures from the DATA block — never invent, estimate, or recall odds or stats. " +
  "Principles: (1) The market is right until proven otherwise; an edge is a price one book is offering above the consensus, not a better forecast. " +
  "(2) ALWAYS present the best 3-5 EV candidates the code surfaced, ranked highest EV first — do NOT withhold picks for being below some bar. A +1% to +5% edge is the normal, healthy range and exactly what to show. Only if the very best candidate is negative or razor-thin should you say the game looks fully priced. " +
  "(3) Big edges are bugs: treat any EV above ~6% (FLAG) as a likely stale or erroneous price needing re-verification, not a green light — still show it, just caveat it. " +
  "(4) You may rank and explain the value the code computed; you may not change the numbers. " +
  "DATA holds two candidate kinds. [LINE] = a game line de-vigged across books; its edge is purely a price discrepancy (one book beating consensus). " +
  "[PROP] = a player prop. A prop marked 'model' has a projection from recent game logs (normal-dist for yards/points, Poisson for small counts like rebounds/assists/threes/Ks) — treat this as a weak second opinion that should sit near the market; a prop marked 'price-only' has no reliable projection, so judge it on the price discrepancy alone. " +
  "Props labeled poisson carry wider uncertainty — say so and keep confidence MEDIUM at best. " +
  "Read EV as: +2-5% = solid value; +1-2% = a smaller but real edge worth showing; near zero = thin/coin-flip; negative = no real edge. Above ~6% is a FLAG (likely stale price), show it but say it needs re-verification. " +
  "Return: summary (rank the best value candidates with their EV%, lead with the strongest, explain why that price looks soft; if the best is thin or negative, say so honestly; end with the screening-not-advice caveat); " +
  "keyStats (up to 4 figures FROM DATA for the top pick — e.g. EV%, projection vs line, best price+book, books surveyed); " +
  "trends (short value notes or empty); bullCase (the case for the flagged value); bearCase (why it may be noise — few books, line may have moved, model uncalibrated, small sample). " +
  "Always end summary with: lines may have moved — verify the current price; this is screening, not betting advice.";

const SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    summary: { type: "string" },
    keyStats: { type: "array", items: { type: "object", additionalProperties: false, properties: { value: { type: "string" }, label: { type: "string" } }, required: ["value", "label"] } },
    trends: { type: "array", items: { type: "object", additionalProperties: false, properties: { dir: { type: "string", enum: ["up", "down"] }, text: { type: "string" } }, required: ["dir", "text"] } },
    bullCase: { type: "string" },
    bearCase: { type: "string" },
  },
  required: ["summary", "keyStats", "trends", "bullCase", "bearCase"],
};

function fmtCand(c) {
  const sign = c.evPct >= 0 ? "+" : "";
  if (c.kind === "prop") {
    const basis = c.basis === "model" ? `model ${c.modelPct}% (proj ${c.mu} vs line ${c.line})` : "price-only";
    return `- ${c.label} [PROP ${c.tier}]: EV ${sign}${c.evPct}% | ${basis} | market-fair ${c.fairPct}% | best ${c.bestOdds} (${c.bestBook}) | ${c.books} books${c.suspicious ? " | FLAG >6%" : ""}`;
  }
  return `- ${c.label} [LINE]: EV ${sign}${c.evPct}% | fair ${c.fairPct}% | best ${c.bestOdds} (${c.bestBook}) | ${c.books} books${c.suspicious ? " | FLAG >6%" : ""}`;
}
async function generate(game, cands) {
  const dataBlock = cands.length ? cands.map(fmtCand).join("\n") : "(no side cleared the value threshold across books)";
  const user = `GAME: ${game}\n\nDATA (value candidates — EV computed in code)\n${dataBlock}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini", temperature: 0.3, max_tokens: 800,
      messages: [{ role: "system", content: PLOK_SYSTEM }, { role: "user", content: user }],
      response_format: { type: "json_schema", json_schema: { name: "findbet", strict: true, schema: SCHEMA } },
    }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return JSON.parse(data.choices[0].message.content);
}

// ── Matchup data (accurate season splits) so results always show team context ──
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
  let streak = sum("streak");
  if (streak && /^-?\d+(\.0+)?$/.test(String(streak).trim())) streak = null;
  const gp = val("gamesplayed");
  let scoredPG = val("avgpointsfor"), allowedPG = val("avgpointsagainst");
  if (scoredPG == null && val("pointsfor") != null && gp) scoredPG = val("pointsfor") / gp;
  if (allowedPG == null && val("pointsagainst") != null && gp) allowedPG = val("pointsagainst") / gp;
  return { overall, home: sum("home"), away: sum("road") || sum("away"), streak, scoredPG, allowedPG };
}
async function buildMatchup(sport, ctx) {
  const em = ESPN_MAP[sport]; if (!em) return null;
  const { away, home } = parseTeams(ctx.game); if (!away && !home) return null;
  const standings = await espnStandings(sport);
  const events = await espnEvents(em.sp, em.lg, sport === "nfl" ? 50 : 30);
  const completed = events.filter(e => e.status?.type?.completed);
  const collect = (teamName) => {
    const tn = normName(teamName); if (!tn) return [];
    const gs = [];
    for (const e of completed) {
      const comp = e.competitions && e.competitions[0]; if (!comp) continue;
      const cs = comp.competitors || [];
      const me = cs.find(c => nameMatch(normName(c.team?.displayName || c.team?.name), tn));
      if (!me) continue;
      const opp = cs.find(c => c !== me);
      const pf = parseFloat(me.score), pa = parseFloat(opp?.score);
      if (isNaN(pf) || isNaN(pa)) continue;
      gs.push({ date: e.date || "", win: me.winner === true || pf > pa, pf, pa, opp: opp?.team?.displayName || "", abbr: me.team?.abbreviation || "" });
    }
    gs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return gs;
  };
  const team = (teamName) => {
    const gs = collect(teamName).slice(0, sport === "nfl" ? 16 : 20);
    const avg = (k) => gs.length ? (gs.reduce((acc, x) => acc + x[k], 0) / gs.length) : null;
    let ws = null; if (gs.length) { let n = 0; for (const x of gs) { if (x.win === gs[0].win) n++; else break; } if (n > 1) ws = `${gs[0].win ? "W" : "L"}${n}`; }
    const st = findTeamStanding(standings, teamName);
    const rec = st ? recFromStats(st.stats) : null;
    const abbr = (st && st.abbr) || (gs[0] && gs[0].abbr) || (teamName || "").split(" ").pop().slice(0, 3).toUpperCase();
    const scored = (rec && rec.scoredPG != null) ? rec.scoredPG.toFixed(1) : (avg("pf") != null ? avg("pf").toFixed(1) : null);
    const allowed = (rec && rec.allowedPG != null) ? rec.allowedPG.toFixed(1) : (avg("pa") != null ? avg("pa").toFixed(1) : null);
    return { name: teamName, abbr, overall: (rec && rec.overall) || null, home: (rec && rec.home) || null, away: (rec && rec.away) || null, scored, allowed, streak: (rec && rec.streak) || ws || null, _games: gs };
  };
  const A = team(away), H = team(home);
  let h2h = null;
  if (away && home) { const hg = A._games.filter(x => nameMatch(normName(x.opp), normName(home))); if (hg.length) { const w = hg.filter(x => x.win).length; h2h = { label: `H2H (last ${hg.length})`, away: `${w}-${hg.length - w}`, home: `${hg.length - w}-${w}` }; } }
  const slim = (t) => ({ name: t.name, abbr: t.abbr, overall: t.overall, home: t.home, away: t.away, scored: t.scored, allowed: t.allowed, streak: t.streak });
  return { away: slim(A), home: slim(H), scoredLabel: sport === "mlb" ? "Runs/game" : "Points/game", allowedLabel: sport === "mlb" ? "Runs allowed/game" : "Points allowed/game", h2h, title: `${A.abbr} @ ${H.abbr}` };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!OPENAI) return res.status(500).json({ error: "OPENAI_API_KEY not set" });
  if (!ODDS) return res.status(500).json({ error: "ODDS_API_KEY not set" });
  try {
    const ctx = req.body || {};
    if (!ctx.game || !ctx.sport) return res.status(400).json({ error: "Missing game/sport" });
    const model = (ctx.model || "ev").toLowerCase();
    if (ctx.userId && !(await isPro(ctx.userId))) return res.status(403).json({ error: "Plok is a Pro feature" });

    const day = new Date().toISOString().slice(0, 10);
    const key = hashKey(["findbet", ctx.sport, ctx.game, model, day].join("|"));
    const cached = await getCached(key);
    if (cached) return res.status(200).json({ ...cached, cached: true });

    let matchup = null;
    try { matchup = await buildMatchup(ctx.sport, ctx); } catch { matchup = null; }

    const event = await fetchGameOdds(ctx.sport, ctx);
    if (!event) {
      const out = { summary: "No live odds are posted for this game yet, so there's no value to screen right now — the matchup data below is current. Check back closer to game time. This is screening, not betting advice.", keyStats: [], trends: [], bullCase: "", bearCase: "", matchup };
      await storeCache(key, out);
      return res.status(200).json({ ...out, cached: false });
    }
    const lineCands = analyzeGame(event);
    let propCands = [];
    try { propCands = await analyzeProps(ctx.sport, event.id); } catch { propCands = []; }
    let cands;
    if (model === "livedog") {
      // Live Dog: best +EV underdogs only (positive American price), game lines.
      cands = lineCands.filter(c => typeof c.bestOdds === "string" && c.bestOdds.trim().startsWith("+")).sort((a, b) => b.evPct - a.evPct).slice(0, 8);
    } else {
      cands = [...lineCands, ...propCands].sort((a, b) => b.evPct - a.evPct).slice(0, 8);
    }

    const out = await generate(ctx.game, cands);
    if (matchup) out.matchup = matchup;
    await storeCache(key, out);
    return res.status(200).json({ ...out, cached: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export { analyzeGame, analyzeProps, SPORT_KEYS };