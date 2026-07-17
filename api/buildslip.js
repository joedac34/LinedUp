// api/buildslip.js — PLOK builds a full 5-slot PickLock slip.
// Given the candidate bets per category + the user's persona / profile / league
// situation, PLOK picks the best bet per slot, assigns multipliers by conviction,
// builds a parlay for the longshot slot, and explains each choice.
//
// Env (already set):
//   VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY (isPro check)
//   OPENAI_API_KEY

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON = process.env.VITE_SUPABASE_ANON_KEY;
const OPENAI = process.env.OPENAI_API_KEY;
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function isPro(userId) {
  if (!userId || !SB_URL) return false;   // fail CLOSED
  try {
    const r = await fetch(`${SB_URL}/rest/v1/users?id=eq.${userId}&select=is_pro`, { headers: sbHeaders });
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] && rows[0].is_pro === true;
  } catch { return false; }   // fail CLOSED
}

const PERSONAS = {
  sharp: "Lens: THE SHARP — price/EV first, risk-averse, avoid juice.",
  degen: "Lens: THE DEGEN — hunt ceiling and plus-money, accept variance.",
  contrarian: "Lens: THE CONTRARIAN — favor the unpopular side when the data backs it.",
  professor: "Lens: THE PROFESSOR — explain the reasoning plainly.",
};

const SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    strategy: { type: "string" },
    picks: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        properties: {
          idx: { type: "integer" },
          ids: { type: "array", items: { type: "string" } },
          mult: { type: "integer" },
          reason: { type: "string" },
        },
        required: ["idx", "ids", "mult", "reason"],
      },
    },
  },
  required: ["strategy", "picks"],
};

function profileBlock(u) {
  if (!u) return "";
  let b = "\nPROFILE\n- Archetype: " + (u.archetype || "unknown") + "\n- Overall: " + (u.record || "0-0") + " (" + (u.winRate || "—") + ")";
  if (u.streak) b += ", streak " + u.streak;
  if (u.byType) b += "\n- By type: " + Object.entries(u.byType).map(([k, v]) => `${k} ${v.record} (${v.pct}%)`).join(", ");
  return b;
}
function leagueBlock(L) {
  if (!L) return "";
  const lines = [];
  lines.push("- Format: " + L.format + (L.finalWeek ? " (FINAL WEEK)" : (L.weeksLeft != null ? `, ${L.weeksLeft} weeks left` : "")));
  if (L.myRank) lines.push(`- Rank #${L.myRank}${L.players ? " of " + L.players : ""}`);
  if (L.leading) lines.push("- Leading the league.");
  else if (L.leaderGap != null) lines.push(`- Behind leader by ${L.leaderGap} pts`);
  if (L.opponent) lines.push(`- This week vs ${L.opponent}: ${L.myWeekPts}-${L.oppWeekPts}` + (L.matchupGap > 0 ? ` (UP ${L.matchupGap})` : L.matchupGap < 0 ? ` (DOWN ${Math.abs(L.matchupGap)})` : " (even)"));
  return "\nLEAGUE\n" + lines.join("\n");
}

import { teamFormFor } from "./trends.js";
import { buildMlbPack } from "./mlbpack.js";

export const maxDuration = 60;

// Real numbers for each game on the board, so a reason can say "7-3 in L10, opposing
// starter 7.20 ERA" instead of "strong value in this matchup". ESPN is free — no Odds
// API credits burned here. Capped + parallel to bound latency.
const MAX_FORM_GAMES = 5;
async function formBlock(sport, candidates) {
  const games = [];
  for (const list of Object.values(candidates || {})) {
    for (const b of (list || [])) {
      if (b && b.game && !games.includes(b.game)) games.push(b.game);
    }
  }
  const use = games.slice(0, MAX_FORM_GAMES);
  if (!use.length) return "";
  const rows = await Promise.all(use.map(async (g) => {
    let form = null, pack = null;
    try { form = await teamFormFor(sport, g); } catch { form = null; }
    if (sport === "mlb") { try { pack = await buildMlbPack({ game: g }); } catch { pack = null; } }
    if (!form && !pack) return null;
    const bits = [];
    if (form) {
      for (const t of [form.away, form.home]) {
        if (!t || !t.record) continue;
        const venue = t.venue === "home" ? "home" : "away";
        let s = `${t.abbr} (${venue}) ${t.record} in last ${t.n}`;
        if (t.pf != null) s += `, ${t.pf} for / ${t.pa} against per game`;
        const vr = venue === "home" ? t.homeRecord : t.awayRecord;
        if (vr) s += `, ${vr} ${venue}`;
        if (t.stale) s += ` [${t.season} season]`;
        bits.push(s);
      }
    }
    if (pack && pack.form) {
      const sp = (side, who) => {
        const f = pack.form[side], nm = (pack.starters && pack.starters[who] && pack.starters[who].name) || null;
        if (!f || !nm) return;
        if (f.last3ERA != null) bits.push(`${nm} (SP) ${Number(f.last3ERA).toFixed(2)} ERA last ${Math.min(f.starts || 3, 3)} starts`);
        if (f.nrfiN >= 3) bits.push(`${nm} scoreless 1st in ${f.nrfiClean} of last ${f.nrfiN} starts`);
      };
      sp("spAway", "away"); sp("spHome", "home");
    }
    return bits.length ? `${g}\n  ` + bits.join("\n  ") : null;
  }));
  const good = rows.filter(Boolean);
  return good.length ? `\n\nFORM (real, from box scores — cite these)\n${good.join("\n")}` : "";
}

// ── Auth ────────────────────────────────────────────────────────────────────
// The user comes from the Authorization token, NEVER the request body. Same
// contract as checkout.js. The old gate was `if (ctx.userId && !isPro(ctx.userId))`:
// omit userId and the check vanished entirely, and a real Pro user's id (one used
// to ship hardcoded in the JS bundle) bought anyone a verified-Pro response.
async function authedUserId(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token || !SB_URL || !SB_ANON) return null;
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u.id : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!OPENAI) return res.status(500).json({ error: "OPENAI_API_KEY not set" });
  try {
    const ctx = req.body || {};
    const slots = Array.isArray(ctx.slots) ? ctx.slots : [];
    const candidates = ctx.candidates || {};
    if (!slots.length || !Object.keys(candidates).length) return res.status(400).json({ error: "Missing slots or candidates" });
    const _uid = await authedUserId(req);
    if (!_uid) return res.status(401).json({ error: "Sign in to use Plok" });
    if (!(await isPro(_uid))) return res.status(403).json({ error: "Building slips is a Pro feature" });

    const strategy = ctx.strategy || "balanced";
    const personaLine = (ctx.persona && PERSONAS[ctx.persona]) ? PERSONAS[ctx.persona] + " " : "";

    const slotLines = slots.map(sl => `- slot ${sl.idx}: category ${sl.category}` + (sl.mult ? ` (fixed mult ${sl.mult})` : "")).join("\n");
    // The pool comes from the league's slot_config and MAY CONTAIN DUPLICATES (a real
    // league runs 1,2,3,3,4,5,6,7). Never assume 1-5.
    const pool = Array.isArray(ctx.multPool) && ctx.multPool.length ? ctx.multPool : slots.map((_, i) => i + 1);
    const poolLine = pool.join(", ");
    const candBlock = Object.entries(candidates).map(([cat, list]) =>
      `${cat.toUpperCase()}:\n` + (list || []).map(b => `  [${b.id}] ${b.pick} ${b.odds || ""}${b.game ? " — " + b.game : ""}`).join("\n")
    ).join("\n");

    const system =
      personaLine +
      `You are Plok, building a ${slots.length}-slot PickLock slip for the user. ` +
      "SLOTS lists each slot (idx, category, and a fixed mult if any). CANDIDATES lists available bets per category, each with an [id]. " +
      `Return EXACTLY ONE pick per slot — ${slots.length} picks, one for every slot idx listed. Never return fewer. ` +
      "For EACH slot, choose the single best candidate id listed under THAT SLOT'S OWN category. " +
      "A 'longshot' slot wants ONE id: every candidate there is already priced +400 or longer, so a single bet qualifies on its own. A longshot is a PRICE, not a parlay. Only return 2-3 ids for that slot if you deliberately want a parlay, and never chase a silly number — two legs is plenty, and a combined price beyond about +2500 is a lottery ticket, not a pick. " +
      "Use ONLY ids that appear under that slot's category in CANDIDATES — an id from another category is a hard error, because the pick would be graded as the slot's type and score wrong. " +
      "NEVER pick two bets that contradict each other within the same game: one team's moneyline and the OTHER team's spread, or both sides of a total. Treat each game as one side — if you back the Phillies moneyline, do not also take the Mets spread. A slip that hedges itself wins nothing. " +
      "If a slot's category has no candidates, omit that slot entirely rather than filling it from another category. " +
      `Assign multipliers from MULT POOL: [${poolLine}]. Use each entry in the pool EXACTLY once across the slots — the pool may contain duplicates, and a duplicate means that value is used that many times. Do not invent a multiplier outside the pool. UNLESS a slot has a fixed mult (then use it). Put your HIGHEST mult on your HIGHEST-conviction pick. ` +
      "Tune to STRATEGY: 'ceiling' = chase upside / plus-money / variance (user is trailing); 'protect' = safer, lower-variance favorites (user is ahead); 'balanced' = best overall mix. Respect the lens, PROFILE, and LEAGUE. " +
      "Each pick needs a reason of 14 words or fewer that CITES A CONCRETE NUMBER from FORM or the odds — venue, last-10 record, runs/points for and against, or a starter's ERA. " +
      "Good: 'Home, 7-3 in last 10, opposing starter 7.20 ERA last 3.' " +
      "Bad: 'Strong value in this matchup' / 'looks solid given recent form' — no number, says nothing. " +
      "Use ONLY numbers present in FORM; never invent or recall a stat. If FORM has nothing for that game, say what the price implies instead. " +
      "'strategy' is a 1-2 sentence summary of the plan for this user's situation. Entertainment, not financial advice; no stake sizing.";

    const form = await formBlock(String(ctx.sport || "").toLowerCase(), candidates);
    const user =
      `STRATEGY: ${strategy}\n\nSLOTS\n${slotLines}\n\nMULT POOL: ${poolLine}\n\nCANDIDATES\n${candBlock}${form}` +
      profileBlock(ctx.userStats) + leagueBlock(ctx.leagueCtx);

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 1600,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_schema", json_schema: { name: "slip", strict: true, schema: SCHEMA } },
      }),
    });
    if (!r.ok) return res.status(502).json({ error: `OpenAI ${r.status}` });
    const data = await r.json();
    const out = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(out);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}