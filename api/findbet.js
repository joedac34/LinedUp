/**
 * /api/findbet.js  —  Plok "find me a bet" value screener
 *
 * The math is done HERE, in code (de-vig, consensus fair prob, EV) — deterministic
 * and exact. The model only screens, ranks, and explains the finished numbers.
 *
 * Method (price-discrepancy / +EV vs consensus):
 *   1. Pull every book's odds for the game (The Odds API).
 *   2. De-vig each book's two-sided market -> that book's fair prob per side.
 *   3. Consensus fair prob per side = average across books offering it.
 *   4. Best available price per side = best decimal odds across books.
 *   5. EV = consensus_fair * best_decimal - 1.  Flag positive EV; treat big
 *      edges (>6%) as likely stale/erroneous, not real (per the guardrails).
 *
 * ENV: ODDS_API_KEY (new use here), OPENAI_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI = process.env.OPENAI_API_KEY;
const ODDS   = process.env.ODDS_API_KEY;

const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
const SPORT_KEYS = { nfl: "americanfootball_nfl", nba: "basketball_nba", mlb: "baseball_mlb" };

const hashKey = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "fb_" + (h >>> 0).toString(36); };
const amToProb = (o) => (o < 0 ? Math.abs(o) / (Math.abs(o) + 100) : 100 / (o + 100));
const amToDec  = (o) => (o < 0 ? 1 + 100 / Math.abs(o) : 1 + o / 100);
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

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
    const cutoff = new Date(Date.now() - 2 * 3600 * 1000).toISOString(); // 2h freshness (odds move)
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
  const xl = x.split(" ").pop(), yl = y.split(" ").pop();
  return xl === yl; // nickname fallback
}
async function fetchGameOdds(sport, ctx) {
  const sk = SPORT_KEYS[sport];
  if (!sk || !ODDS) return null;
  const url = `https://api.the-odds-api.com/v4/sports/${sk}/odds?apiKey=${ODDS}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Odds API ${r.status}`);
  const events = await r.json();
  const { home, away } = parseTeams(ctx.game);
  const wantHome = ctx.home || home, wantAway = ctx.away || away;
  // Find the event whose teams match the requested game.
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

// De-vig every book, build consensus fair prob per side, find +EV best prices.
function analyzeGame(event) {
  const sides = {};
  for (const bk of (event.bookmakers || [])) {
    for (const mk of (bk.markets || [])) {
      const outs = mk.outcomes || [];
      if (outs.length !== 2) continue; // de-vig needs both sides
      const probs = outs.map(o => amToProb(o.price));
      const sum = probs[0] + probs[1];
      if (!sum) continue;
      outs.forEach((o, i) => {
        const fair = probs[i] / sum;
        const dec = amToDec(o.price);
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
    if (s.fairs.length < 3) continue; // need a real consensus
    const consensus = s.fairs.reduce((a, b) => a + b, 0) / s.fairs.length;
    const ev = consensus * s.bestDec - 1;
    if (ev >= 0.01) {
      cands.push({
        label: labelFor(s.market, s.name, s.point),
        market: s.market,
        evPct: parseFloat((ev * 100).toFixed(1)),
        fairPct: parseFloat((consensus * 100).toFixed(1)),
        bestOdds: (s.bestAm > 0 ? "+" : "") + s.bestAm,
        bestBook: s.bestBook,
        books: s.fairs.length,
        suspicious: ev > 0.06, // big edges are bugs
      });
    }
  }
  cands.sort((a, b) => b.evPct - a.evPct);
  return cands.slice(0, 6);
}

// ── Plok screening prompt (distilled from the guardrail framework) ───────────
const PLOK_SYSTEM =
  "You are Plok, PickLock's betting analyst. You SCREEN for value; you do not give betting advice, place bets, or suggest stake sizes. " +
  "Cite only figures from the DATA block — never invent, estimate, or recall odds or stats. " +
  "Principles: (1) The market is right until proven otherwise; a flagged edge is a rare exception, not a better forecast. " +
  "(2) 'No strong edge' is a good, common answer — never manufacture a pick to fill space; if DATA has no qualifying value, say so plainly. " +
  "(3) Big edges are bugs: treat any EV above ~6% as a likely stale or erroneous price needing re-verification, not a green light. " +
  "(4) You may rank and explain the value the code already computed; you may not change the numbers. " +
  "The DATA lists value candidates already de-vigged across books: each with market, best available price + book, consensus fair probability, EV%, and books surveyed. " +
  "Read EV as: under +1% = no bet; +1-2% = marginal; +2-5% = qualifying value; above +5% = re-verify before trusting. " +
  "Return: summary (plain-English read of the strongest value or that there is none, why the price looks soft, and the caveat that this is screening not advice); " +
  "keyStats (up to 4 figures FROM DATA — EV%, fair probability, best price+book, books surveyed; empty if no candidates); " +
  "trends (short value notes or empty); bullCase (the case for the flagged value); bearCase (why it may be noise — few books, line may have moved, model uncalibrated). " +
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

async function generate(game, cands) {
  const dataBlock = cands.length
    ? cands.map(c => `- ${c.label}: EV ${c.evPct >= 0 ? "+" : ""}${c.evPct}% | fair ${c.fairPct}% | best ${c.bestOdds} (${c.bestBook}) | ${c.books} books${c.suspicious ? " | FLAG: edge >6%, likely stale" : ""}`).join("\n")
    : "(no side cleared the value threshold across books)";
  const user = `GAME: ${game}\n\nDATA (value candidates, EV computed across books)\n${dataBlock}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini", temperature: 0.3, max_tokens: 700,
      messages: [{ role: "system", content: PLOK_SYSTEM }, { role: "user", content: user }],
      response_format: { type: "json_schema", json_schema: { name: "findbet", strict: true, schema: SCHEMA } },
    }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return JSON.parse(data.choices[0].message.content);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!OPENAI) return res.status(500).json({ error: "OPENAI_API_KEY not set" });
  if (!ODDS) return res.status(500).json({ error: "ODDS_API_KEY not set" });
  try {
    const ctx = req.body || {};
    if (!ctx.game || !ctx.sport) return res.status(400).json({ error: "Missing game/sport" });
    if (ctx.userId && !(await isPro(ctx.userId))) return res.status(403).json({ error: "Plok is a Pro feature" });

    const day = new Date().toISOString().slice(0, 10);
    const key = hashKey(["findbet", ctx.sport, ctx.game, day].join("|"));
    const cached = await getCached(key);
    if (cached) return res.status(200).json({ ...cached, cached: true });

    const event = await fetchGameOdds(ctx.sport, ctx);
    if (!event) {
      const out = { summary: "I couldn't find live two-sided odds for that game right now, so there's nothing to screen. Try again closer to game time. This is screening, not betting advice.", keyStats: [], trends: [], bullCase: "", bearCase: "" };
      return res.status(200).json({ ...out, cached: false });
    }
    const cands = analyzeGame(event);
    const out = await generate(ctx.game, cands);
    await storeCache(key, out);
    return res.status(200).json({ ...out, cached: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
