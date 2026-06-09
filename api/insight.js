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

async function fetchSportsData(ctx) {
  if (!SDIO) return { lines: [], note: "no stats key" };
  const out = { lines: [] };
  if (ctx.betType === "prop" && ctx.player) {
    const s = await playerStats(ctx.sport, ctx.player, ctx.market || ctx.selection, num(ctx.line));
    if (s && s.lines) out.lines.push(...s.lines);
    if (s && s.team) out.note = `${ctx.player} — ${s.position || ""} ${s.team || ""}`.trim();
  } else {
    // team line: pull the picked team's record
    const hint = (ctx.selection || "").replace(/[+-]?\d+\.?\d*$/, "").replace(/\bML\b/i, "").trim();
    const s = await teamStats(ctx.sport, hint);
    if (s && s.lines) out.lines.push(...s.lines);
  }
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
