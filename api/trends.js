// api/trends.js — Plok "Trends & Form" lens.
// Principle: every number here comes from real data (ESPN season splits + H2H for the
// matchup card across all sports; DataFeeds recent-form game logs for MLB — last-10,
// starter NRFI rates, rolling ERA). The LLM only NARRATES the supplied facts; it is
// never asked to invent a stat. Returns the same shape AiInsightBubble already renders.

import { buildMlbPack } from "./mlbpack.js";
import { buildMatchup } from "./findbet.js";

const OPENAI = process.env.OPENAI_API_KEY;
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

async function isPro(userId) {
  if (!userId || !SB_URL || !SB_KEY) return false;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/users?id=eq.${userId}&select=is_pro`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] && rows[0].is_pro === true;
  } catch { return false; }
}

const _cache = new Map();
function cacheGet(k) { const v = _cache.get(k); if (v && Date.now() - v.t < 30 * 60 * 1000) return v.d; return null; }
function cacheSet(k, d) { _cache.set(k, { t: Date.now(), d }); }

function parseRec(rec) { const m = String(rec || "").match(/(\d+)\s*-\s*(\d+)/); return m ? { w: +m[1], l: +m[2] } : null; }

// ── MLB trend bullets from the DataFeeds recent-form layer + season ranks ──
function mlbBullets(pack, matchup) {
  const t = [];
  const f = pack.form || {};
  const rA = (pack.rates && pack.rates.away) || {}, rH = (pack.rates && pack.rates.home) || {};
  const aAbbr = (matchup && matchup.away && matchup.away.abbr) || pack.away;
  const hAbbr = (matchup && matchup.home && matchup.home.abbr) || pack.home;
  const aSPn = (pack.starters && pack.starters.away && pack.starters.away.name) || "Away SP";
  const hSPn = (pack.starters && pack.starters.home && pack.starters.home.name) || "Home SP";

  // last-10 form
  if (f.teamAway && f.teamHome) {
    const a = parseRec(f.teamAway.record), h = parseRec(f.teamHome.record);
    if (a && h) {
      if (a.w !== h.w) {
        const hot = a.w > h.w ? { ab: aAbbr, r: f.teamAway } : { ab: hAbbr, r: f.teamHome };
        t.push({ dir: "up", text: `${hot.ab} enter hotter — ${hot.r.record} over their last ${hot.r.n}, ${hot.r.rf} runs scored vs ${hot.r.ra} allowed per game.` });
      } else {
        t.push({ dir: "up", text: `Even form: both clubs are ${f.teamAway.record} over their last 10.` });
      }
    }
  }
  // starter NRFI / YRFI
  const nrfi = (sp, name, ab) => {
    if (!sp || !(sp.nrfiN >= 3)) return;
    const pct = sp.nrfiClean / sp.nrfiN;
    if (pct >= 0.6) t.push({ dir: "up", text: `${name} (${ab}) has worked a scoreless 1st in ${sp.nrfiClean} of his last ${sp.nrfiN} starts — a live NRFI angle.` });
    else if (pct <= 0.34) t.push({ dir: "down", text: `${name} (${ab}) has surrendered a 1st-inning run in ${sp.nrfiN - sp.nrfiClean} of his last ${sp.nrfiN} starts — leans YRFI.` });
  };
  nrfi(f.spAway, aSPn, aAbbr);
  nrfi(f.spHome, hSPn, hAbbr);
  // rolling starter ERA
  const spForm = (sp, name, ab) => {
    if (!sp || sp.last3ERA == null || !(sp.starts >= 2)) return;
    const era = Number(sp.last3ERA), n = Math.min(sp.starts, 3);
    if (era <= 3.0) t.push({ dir: "up", text: `${name} (${ab}) is rolling — ${era.toFixed(2)} ERA over his last ${n} starts.` });
    else if (era >= 5.5) t.push({ dir: "down", text: `${name} (${ab}) has scuffled — ${era.toFixed(2)} ERA over his last ${n} starts.` });
  };
  spForm(f.spAway, aSPn, aAbbr);
  spForm(f.spHome, hSPn, hAbbr);
  // run environment via league ranks
  const ranks = (r) => (r && r.ranks) || {};
  const aS = ranks(rA).staffERA, hS = ranks(rH).staffERA, aR = ranks(rA).rpg, hR = ranks(rH).rpg;
  if (aS && hS && aS <= 12 && hS <= 12) t.push({ dir: "down", text: `Two quality staffs (${aAbbr} #${aS}, ${hAbbr} #${hS} in ERA) — profiles toward a lower-scoring game.` });
  else if (aR && hR && aR <= 12 && hR <= 12) t.push({ dir: "up", text: `Two of the better offenses here (${aAbbr} #${aR}, ${hAbbr} #${hR} in runs/game) — runs could flow.` });
  // bullpen edge
  const aP = ranks(rA).penERA, hP = ranks(rH).penERA;
  if (aP && hP && Math.abs(aP - hP) >= 10) {
    const better = aP < hP ? aAbbr : hAbbr, worse = aP < hP ? hAbbr : aAbbr;
    t.push({ dir: "up", text: `Bullpen edge: ${better}'s pen (#${Math.min(aP, hP)}) over ${worse}'s (#${Math.max(aP, hP)}) — matters in the late innings.` });
  }
  return t;
}

// ── NFL / NBA trend bullets from ESPN season splits + streak + H2H ──
function teamBullets(m) {
  const t = [];
  if (!m) return t;
  const streak = (s, ab) => {
    if (!s) return;
    const win = /^w/i.test(String(s).trim());
    const n = parseInt(String(s).replace(/\D/g, ""), 10) || 0;
    if (n >= 2) t.push({ dir: win ? "up" : "down", text: `${ab} ${win ? "are riding" : "are mired in"} a ${n}-game ${win ? "win" : "losing"} streak.` });
  };
  streak(m.away.streak, m.away.abbr);
  streak(m.home.streak, m.home.abbr);
  const num = (x) => { const f = parseFloat(x); return isNaN(f) ? null : f; };
  const aS = num(m.away.scored), hA = num(m.home.allowed), hS = num(m.home.scored), aA = num(m.away.allowed);
  if (aS != null && hA != null && Math.abs(aS - hA) >= 3) t.push({ dir: aS > hA ? "up" : "down", text: `${m.away.abbr} average ${m.away.scored} ${m.scoredLabel || "/g"} into a ${m.home.abbr} defense allowing ${m.home.allowed}.` });
  if (hS != null && aA != null && Math.abs(hS - aA) >= 3) t.push({ dir: hS > aA ? "up" : "down", text: `${m.home.abbr} put up ${m.home.scored} against a ${m.away.abbr} side giving up ${m.away.allowed}.` });
  if (m.away.away) t.push({ dir: "up", text: `${m.away.abbr} road form: ${m.away.away}.` });
  if (m.home.home) t.push({ dir: "up", text: `${m.home.abbr} at home: ${m.home.home}.` });
  if (m.h2h) t.push({ dir: "up", text: `${m.h2h.label}: ${m.away.abbr} ${m.h2h.away}, ${m.home.abbr} ${m.h2h.home}.` });
  return t;
}

async function narrate(game, facts) {
  if (!OPENAI) return "";
  const sys = "You are Plok's Trends & Form lens for a sports pick'em app. Using ONLY the facts provided, write a tight 2-3 sentence read of the form and trends in this matchup. Rules: never invent a number or stat not in the facts; do not state a betting price or a specific bet to make; you MAY note a qualitative 'lean' or 'angle' (e.g. NRFI, the over, the hotter side); confident and plain, no hype, no emojis. Lead with the most decision-relevant trend.";
  const usr = `Matchup: ${game}\n\nFacts:\n${facts}`;
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI}` },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.4, max_tokens: 220, messages: [{ role: "system", content: sys }, { role: "user", content: usr }] }),
    });
    if (!r.ok) return "";
    const d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || "").trim();
  } catch { return ""; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const ctx = req.body || {};
    if (!ctx.game || !ctx.sport) return res.status(400).json({ error: "Missing game/sport" });
    if (ctx.userId && !(await isPro(ctx.userId))) return res.status(403).json({ error: "Plok is a Pro feature" });

    const sport = String(ctx.sport).toLowerCase();
    const day = new Date().toISOString().slice(0, 10);
    const key = ["trends", sport, ctx.game, day].join("|");
    const cached = cacheGet(key);
    if (cached) return res.status(200).json({ ...cached, cached: true });

    let matchup = null;
    try { matchup = await buildMatchup(sport, { game: ctx.game }); } catch { matchup = null; }

    let trends = [];
    let factLines = [];
    let pack = null;

    if (sport === "mlb") {
      try { pack = await buildMlbPack({ game: ctx.game }); } catch { pack = null; }
      if (pack) {
        if (!matchup && pack.matchup) matchup = pack.matchup;
        trends = mlbBullets(pack, matchup);
        factLines = (pack.lines || []).map((l) => `${l.label}: ${l.value}`);
        if (pack.note) factLines.unshift(pack.note);
      }
    }

    if (!trends.length && matchup) trends = teamBullets(matchup);
    if (matchup && !factLines.length) {
      const m = matchup;
      factLines = [
        `${m.away.abbr} record: ${m.away.overall || "n/a"} (home ${m.away.home || "n/a"}, road ${m.away.away || "n/a"}, streak ${m.away.streak || "n/a"})`,
        `${m.home.abbr} record: ${m.home.overall || "n/a"} (home ${m.home.home || "n/a"}, road ${m.home.away || "n/a"}, streak ${m.home.streak || "n/a"})`,
        `${m.scoredLabel || "Scored/g"}: ${m.away.abbr} ${m.away.scored || "n/a"}, ${m.home.abbr} ${m.home.scored || "n/a"}`,
        `${m.allowedLabel || "Allowed/g"}: ${m.away.abbr} ${m.away.allowed || "n/a"}, ${m.home.abbr} ${m.home.allowed || "n/a"}`,
      ];
      if (m.h2h) factLines.push(`${m.h2h.label}: ${m.away.abbr} ${m.h2h.away}, ${m.home.abbr} ${m.h2h.home}`);
    }

    if (!matchup && !trends.length) {
      const out = { summary: "No recent form or standings data is posted for this matchup yet — check back closer to game time. This is form analysis, not betting advice.", keyStats: [], trends: [], matchup: null, model: "trends" };
      cacheSet(key, out);
      return res.status(200).json({ ...out, cached: false });
    }

    const factText = [...factLines, ...trends.map((t) => `- ${t.text}`)].join("\n");
    let summary = await narrate(ctx.game, factText);
    if (!summary) {
      summary = trends.length ? trends.slice(0, 2).map((t) => t.text).join(" ") : "Here's the recent form and season context for this matchup.";
    }

    // keyStats only render in the bubble when there's no matchup card — provide a small fallback.
    let keyStats = [];
    if (!matchup && pack && pack.rates) {
      const rA = pack.rates.away || {}, rH = pack.rates.home || {};
      keyStats = [
        { value: rA.record || "—", label: `${pack.away} record` },
        { value: rH.record || "—", label: `${pack.home} record` },
        { value: rA.rpg != null ? String(rA.rpg) : "—", label: "Away runs/g" },
        { value: rH.rpg != null ? String(rH.rpg) : "—", label: "Home runs/g" },
      ];
    }

    const out = { summary, keyStats, trends: trends.slice(0, 6), matchup, conviction: null, verdict: "none", model: "trends" };
    cacheSet(key, out);
    return res.status(200).json({ ...out, cached: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
