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
const OPENAI = process.env.OPENAI_API_KEY;
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function isPro(userId) {
  if (!userId || !SB_URL) return true;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/users?id=eq.${userId}&select=is_pro`, { headers: sbHeaders });
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] && rows[0].is_pro === true;
  } catch { return true; }
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!OPENAI) return res.status(500).json({ error: "OPENAI_API_KEY not set" });
  try {
    const ctx = req.body || {};
    const slots = Array.isArray(ctx.slots) ? ctx.slots : [];
    const candidates = ctx.candidates || {};
    if (!slots.length || !Object.keys(candidates).length) return res.status(400).json({ error: "Missing slots or candidates" });
    if (ctx.userId && !(await isPro(ctx.userId))) return res.status(403).json({ error: "Building slips is a Pro feature" });

    const strategy = ctx.strategy || "balanced";
    const personaLine = (ctx.persona && PERSONAS[ctx.persona]) ? PERSONAS[ctx.persona] + " " : "";

    const slotLines = slots.map(sl => `- slot ${sl.idx}: category ${sl.category}` + (sl.mult ? ` (fixed mult ${sl.mult})` : "")).join("\n");
    const candBlock = Object.entries(candidates).map(([cat, list]) =>
      `${cat.toUpperCase()}:\n` + (list || []).map(b => `  [${b.id}] ${b.pick} ${b.odds || ""}${b.game ? " — " + b.game : ""}`).join("\n")
    ).join("\n");

    const system =
      personaLine +
      "You are Plok, building a 5-slot PickLock slip for the user. " +
      "SLOTS lists each slot (idx, category, and a fixed mult if any). CANDIDATES lists available bets per category, each with an [id]. " +
      "For EACH slot, choose the single best candidate id of that category. For a 'longshot' slot, choose 2 or 3 candidate ids to form a parlay. Use ONLY ids that appear under that category in CANDIDATES. " +
      "Assign 'mult' 1-5, each value used EXACTLY once across the slots, UNLESS a slot has a fixed mult (then use it). Put your HIGHEST mult on your HIGHEST-conviction pick. " +
      "Tune to STRATEGY: 'ceiling' = chase upside / plus-money / variance (user is trailing); 'protect' = safer, lower-variance favorites (user is ahead); 'balanced' = best overall mix. Respect the lens, PROFILE, and LEAGUE. " +
      "Each pick needs a reason of 12 words or fewer. 'strategy' is a 1-2 sentence summary of the plan for this user's situation. Entertainment, not financial advice; no stake sizing.";

    const user =
      `STRATEGY: ${strategy}\n\nSLOTS\n${slotLines}\n\nCANDIDATES\n${candBlock}` +
      profileBlock(ctx.userStats) + leagueBlock(ctx.leagueCtx);

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 700,
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
