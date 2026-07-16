// api/trends.js — Plok "Trends & Form" lens.
//
// Principle: every number here comes from real data. The LLM narrates facts the code
// computed; it is never asked to invent, recall or estimate a stat.
//
// Sources:
//   - ESPN /teams/{id}/schedule?season=YYYY&seasontype=2 — full regular-season game log
//     (final scores, home/away). Probe-verified 7/2026 across NFL/NBA/MLB.
//   - ESPN standings + H2H via buildMatchup (the matchup card).
//   - MLB only: buildMlbPack recent-form layer (last-10, starter NRFI rates, rolling ERA).
//
// ── Two ESPN traps, both probe-confirmed, both silent if you get them wrong ──
//  1. score SHAPE. /scoreboard returns competitor.score as a STRING. This endpoint
//     returns an OBJECT: {value, displayValue}. parseFloat on the object = NaN and every
//     trend quietly comes back empty. Use scoreVal().
//  2. season ECHO. The `season` field describes where the LEAGUE is right now, not what
//     was requested — asking for NFL 2025 regular season in July echoes back
//     {2025, type 4, Off Season} while correctly returning 17 completed games. Validate
//     against `requestedSeason`. Never against `season`.
//
// ── The ATS guardrail ──
// We do NOT have historical closing lines, so we can NEVER claim real cover/ATS history.
// What we compute is different and stated as such: TONIGHT'S number applied backwards
// over real past results. Every string says so ("with tonight's -3.5 applied..."). If you
// ever find yourself writing "covered in 6 of 10", stop — that's a claim we can't make.

import { buildMlbPack } from "./mlbpack.js";
import { buildMatchup } from "./findbet.js";

const OPENAI = process.env.OPENAI_API_KEY;
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

const ESPN_MAP = {
  nfl: { sp: "football", lg: "nfl" },
  nba: { sp: "basketball", lg: "nba" },
  mlb: { sp: "baseball", lg: "mlb" },
};

const MIN_LOG = 6;    // below this a split is noise — say nothing rather than something weak
const VENUE_MIN = 3;  // a 1-game home "split" is not a trend. Applies to EVERY venue split.
const WINDOW = 10;    // "last 10" everywhere

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
const _teams = new Map(); // sport -> {t, list}

function parseRec(rec) { const m = String(rec || "").match(/(\d+)\s*-\s*(\d+)/); return m ? { w: +m[1], l: +m[2] } : null; }
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

function parseTeams(game) {
  const s = String(game || "").trim();
  if (s.includes("@")) { const p = s.split("@"); return { away: p[0].trim(), home: p[1].trim() }; }
  const m = s.split(/\s+(?:vs\.?|at)\s+/i);
  if (m.length === 2) return { away: m[0].trim(), home: m[1].trim() };
  return { away: "", home: "" };
}

// ── PURE: season-year resolver ─────────────────────────────────────────────
// The year means a different thing per sport (probe-confirmed):
//   MLB 2026 -> the 2026 season.            (calendar year)
//   NFL 2025 -> Sep 2025 through Jan 2026.  (STARTING year — Jan/Feb belong to prior yr)
//   NBA 2026 -> the 2025-26 season.         (ENDING year — Oct+ rolls forward)
// Hardcoding getFullYear() silently pulls the wrong NBA season for ~3 months a year.
export function seasonYear(sport, now = new Date()) {
  const y = now.getUTCFullYear(), m = now.getUTCMonth() + 1;
  if (sport === "nfl") return m >= 8 ? y : y - 1;
  if (sport === "nba") return m >= 10 ? y + 1 : y;
  return y; // mlb
}

// ── PURE: ESPN score object -> number ──────────────────────────────────────
export function scoreVal(s) {
  const v = s && typeof s === "object" ? s.value : s;
  const f = parseFloat(v);
  return isNaN(f) ? null : f;
}

// ── PURE: schedule payload -> game log rows (oldest first) ─────────────────
export function parseLog(json, teamId) {
  const evs = (json && json.events) || [];
  const out = [];
  for (const e of evs) {
    const c = e && e.competitions && e.competitions[0];
    if (!c || !(c.status && c.status.type && c.status.type.completed)) continue;
    const cs = c.competitors || [];
    const me = cs.find((x) => String(x.id) === String(teamId));
    const opp = cs.find((x) => String(x.id) !== String(teamId));
    if (!me || !opp) continue;
    const pf = scoreVal(me.score), pa = scoreVal(opp.score);
    if (pf == null || pa == null) continue;
    out.push({
      date: String(e.date || "").slice(0, 10),
      home: me.homeAway === "home" && !c.neutralSite,
      opp: (opp.team && opp.team.abbreviation) || "",
      pf, pa,
      total: pf + pa,
      margin: pf - pa,
      win: me.winner === true || pf > pa,
    });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

// ── PURE: last-N form ──────────────────────────────────────────────────────
export function formSplit(log, n = WINDOW) {
  const rec = log.slice(-n);
  if (rec.length < MIN_LOG) return null;
  const w = rec.filter((g) => g.win).length;
  const avg = (k) => +(rec.reduce((a, g) => a + g[k], 0) / rec.length).toFixed(1);
  const home = rec.filter((g) => g.home), away = rec.filter((g) => !g.home);
  const rc = (rows) => `${rows.filter((g) => g.win).length}-${rows.filter((g) => !g.win).length}`;
  return {
    n: rec.length, record: `${w}-${rec.length - w}`,
    pf: avg("pf"), pa: avg("pa"),
    // null under VENUE_MIN — "0-1 at home" is a fact, not a trend, and reads as the latter.
    homeRecord: home.length >= VENUE_MIN ? rc(home) : null, homeN: home.length,
    awayRecord: away.length >= VENUE_MIN ? rc(away) : null, awayN: away.length,
  };
}

// ── PURE: tonight's TOTAL applied backwards, split by venue ────────────────
// NOT an over/under history — those would need each game's own closing total.
export function totalSplit(log, line, n = WINDOW) {
  if (line == null || !isFinite(line)) return null;
  const rec = log.slice(-n);
  if (rec.length < MIN_LOG) return null;
  const f = (rows) => {
    let o = 0, u = 0, p = 0;
    for (const g of rows) { if (g.total > line) o++; else if (g.total < line) u++; else p++; }
    return { o, u, p, n: rows.length };
  };
  const home = rec.filter((g) => g.home), away = rec.filter((g) => !g.home);
  return {
    line, all: f(rec),
    home: home.length >= VENUE_MIN ? f(home) : null,
    away: away.length >= VENUE_MIN ? f(away) : null,
    avgTotal: +(rec.reduce((a, g) => a + g.total, 0) / rec.length).toFixed(1),
  };
}

// ── PURE: tonight's SPREAD applied backwards, split by venue ───────────────
// point is THIS team's number (-3.5 favored, +3.5 dog). Result > 0 = would have covered.
export function spreadSplit(log, point, n = WINDOW) {
  if (point == null || !isFinite(point)) return null;
  const rec = log.slice(-n);
  if (rec.length < MIN_LOG) return null;
  const f = (rows) => {
    let c = 0, nc = 0, p = 0;
    for (const g of rows) { const r = g.margin + point; if (r > 0) c++; else if (r < 0) nc++; else p++; }
    return { c, nc, p, n: rows.length };
  };
  const home = rec.filter((g) => g.home), away = rec.filter((g) => !g.home);
  return {
    point, all: f(rec),
    home: home.length >= VENUE_MIN ? f(home) : null,
    away: away.length >= VENUE_MIN ? f(away) : null,
    avgMargin: +(rec.reduce((a, g) => a + g.margin, 0) / rec.length).toFixed(1),
  };
}

const sgn = (p) => (p > 0 ? `+${p}` : `${p}`);

// ── PURE: splits -> trend bullets. Wording is load-bearing. ────────────────
// Every bullet is tagged {team, kind} so selectBullets can keep the two sides balanced.
// An untagged global slice let one team's bullets crowd the other's out entirely — and
// the model then argued from a split the user could not see on screen.
export function teamish(x, name, abbr) {
  const n = norm(x);
  if (!n) return false;
  for (const c of [norm(name), norm(abbr)]) {
    if (!c) continue;
    if (n === c || n.includes(c) || c.includes(n)) return true;
    const a = n.split(" ").pop(), b = c.split(" ").pop();
    if (a && b && a === b) return true; // nickname fallback: "phillies" === "phillies"
  }
  return false;
}

export function trendBullets(sport, aAbbr, hAbbr, aLog, hLog, lines, aName, hName) {
  const t = [];
  const side = (abbr, log) => {
    const fm = formSplit(log);
    if (!fm) return;
    t.push({
      team: abbr, kind: "form",
      dir: parseRec(fm.record) && parseRec(fm.record).w >= Math.ceil(fm.n / 2) ? "up" : "down",
      text: `${abbr} are ${fm.record} over their last ${fm.n} — ${fm.pf} ${sport === "mlb" ? "runs" : "points"} for, ${fm.pa} against per game.`,
    });
    // Both sides must clear VENUE_MIN or this says nothing.
    if (fm.homeRecord && fm.awayRecord) {
      t.push({ team: abbr, kind: "venue", dir: "up", text: `Venue split over that stretch: ${abbr} ${fm.homeRecord} at home, ${fm.awayRecord} on the road.` });
    }
  };
  side(aAbbr, aLog);
  side(hAbbr, hLog);

  const total = lines && lines.total != null ? lines.total : null;
  if (total != null) {
    for (const b of [{ ab: aAbbr, log: aLog }, { ab: hAbbr, log: hLog }]) {
      const ts = totalSplit(b.log, total);
      if (!ts) continue;
      t.push({
        team: b.ab, kind: "total",
        dir: ts.all.o > ts.all.u ? "up" : "down",
        text: `Apply tonight's ${total} total to ${b.ab}'s last ${ts.all.n} results and ${ts.all.o} clear it, ${ts.all.u} fall short — averaging ${ts.avgTotal.toFixed(1)} combined ${sport === "mlb" ? "runs" : "points"} per game.`,
      });
      if (ts.home && ts.away) {
        t.push({
          team: b.ab, kind: "totalVenue",
          dir: ts.home.o >= ts.away.o ? "up" : "down",
          text: `Same number by venue for ${b.ab}: ${ts.home.o} of ${ts.home.n} over at home, ${ts.away.o} of ${ts.away.n} on the road.`,
        });
      }
    }
  }

  for (const sp of (lines && lines.spreads) || []) {
    const isAway = teamish(sp.team, aName, aAbbr), isHome = teamish(sp.team, hName, hAbbr);
    if (isAway === isHome) continue; // unmatched or matches both -> say nothing, never guess
    const log = isAway ? aLog : hLog;
    const ab = isAway ? aAbbr : hAbbr;
    const ss = spreadSplit(log, sp.point);
    if (!ss) continue;
    t.push({
      team: ab, kind: "spread",
      dir: ss.all.c > ss.all.nc ? "up" : "down",
      text: `Give ${ab} tonight's ${sgn(sp.point)} against their last ${ss.all.n} results and ${ss.all.c} land on the right side, ${ss.all.nc} don't — average margin ${sgn(ss.avgMargin)} per game.`,
    });
    if (ss.home && ss.away) {
      t.push({
        team: ab, kind: "spreadVenue",
        dir: ss.home.c >= ss.away.c ? "up" : "down",
        text: `${ab} with that number: ${ss.home.c} of ${ss.home.n} at home, ${ss.away.c} of ${ss.away.n} away.`,
      });
    }
  }
  const seen = new Set();
  return t.filter((b) => { if (seen.has(b.text)) return false; seen.add(b.text); return true; });
}

// ── PURE: pick what to SHOW — balanced across teams, best kind first. ──────
// Round-robins the two sides so neither can be truncated away, then fills with
// untagged (MLB starter/bullpen) bullets. Whatever this returns is exactly what the
// model is allowed to argue from.
const KIND_RANK = { total: 0, spread: 1, form: 2, totalVenue: 3, spreadVenue: 4, venue: 5 };
export function selectBullets(bullets, max = 8) {
  const rank = (b) => (KIND_RANK[b.kind] != null ? KIND_RANK[b.kind] : 9);
  const teams = [];
  const byTeam = new Map();
  const loose = [];
  for (const b of bullets) {
    if (!b.team) { loose.push(b); continue; }
    if (!byTeam.has(b.team)) { byTeam.set(b.team, []); teams.push(b.team); }
    byTeam.get(b.team).push(b);
  }
  for (const k of teams) byTeam.get(k).sort((x, y) => rank(x) - rank(y));
  const out = [];
  for (let i = 0; out.length < max; i++) {
    let added = false;
    for (const k of teams) {
      const list = byTeam.get(k);
      if (i < list.length && out.length < max) { out.push(list[i]); added = true; }
    }
    if (!added) break;
  }
  for (const b of loose) { if (out.length >= max) break; out.push(b); }
  return out;
}

// ── MLB recent-form bullets (DataFeeds layer) ─────────────────────────────
function mlbBullets(pack, matchup) {
  const t = [];
  const f = pack.form || {};
  const rA = (pack.rates && pack.rates.away) || {}, rH = (pack.rates && pack.rates.home) || {};
  const aAbbr = (matchup && matchup.away && matchup.away.abbr) || pack.away;
  const hAbbr = (matchup && matchup.home && matchup.home.abbr) || pack.home;
  const aSPn = (pack.starters && pack.starters.away && pack.starters.away.name) || "Away SP";
  const hSPn = (pack.starters && pack.starters.home && pack.starters.home.name) || "Home SP";
  const nrfi = (sp, name, ab) => {
    if (!sp || !(sp.nrfiN >= 3)) return;
    const pct = sp.nrfiClean / sp.nrfiN;
    if (pct >= 0.6) t.push({ dir: "up", text: `${name} (${ab}) has worked a scoreless 1st in ${sp.nrfiClean} of his last ${sp.nrfiN} starts — a live NRFI angle.` });
    else if (pct <= 0.34) t.push({ dir: "down", text: `${name} (${ab}) has surrendered a 1st-inning run in ${sp.nrfiN - sp.nrfiClean} of his last ${sp.nrfiN} starts — leans YRFI.` });
  };
  nrfi(f.spAway, aSPn, aAbbr);
  nrfi(f.spHome, hSPn, hAbbr);
  const spForm = (sp, name, ab) => {
    if (!sp || sp.last3ERA == null || !(sp.starts >= 2)) return;
    const era = Number(sp.last3ERA), n = Math.min(sp.starts, 3);
    if (era <= 3.0) t.push({ dir: "up", text: `${name} (${ab}) is rolling — ${era.toFixed(2)} ERA over his last ${n} starts.` });
    else if (era >= 5.5) t.push({ dir: "down", text: `${name} (${ab}) has scuffled — ${era.toFixed(2)} ERA over his last ${n} starts.` });
  };
  spForm(f.spAway, aSPn, aAbbr);
  spForm(f.spHome, hSPn, hAbbr);
  const ranks = (r) => (r && r.ranks) || {};
  const aP = ranks(rA).penERA, hP = ranks(rH).penERA;
  if (aP && hP && Math.abs(aP - hP) >= 10) {
    const better = aP < hP ? aAbbr : hAbbr, worse = aP < hP ? hAbbr : aAbbr;
    t.push({ dir: "up", text: `Bullpen edge: ${better}'s pen (#${Math.min(aP, hP)}) over ${worse}'s (#${Math.max(aP, hP)}) — matters in the late innings.` });
  }
  return t;
}

// ── ESPN fetch layer ──────────────────────────────────────────────────────
async function espnTeams(sport) {
  const c = _teams.get(sport);
  if (c && Date.now() - c.t < 24 * 3600 * 1000) return c.list;
  const em = ESPN_MAP[sport]; if (!em) return [];
  try {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${em.sp}/${em.lg}/teams`);
    if (!r.ok) return [];
    const j = await r.json();
    const raw = (((j.sports || [])[0] || {}).leagues || [])[0];
    const list = ((raw && raw.teams) || []).map((x) => x.team).filter(Boolean).map((t) => ({
      id: t.id, abbr: t.abbreviation || "",
      names: [t.displayName, t.shortDisplayName, t.name, t.location, t.abbreviation].filter(Boolean).map(norm),
    }));
    _teams.set(sport, { t: Date.now(), list });
    return list;
  } catch { return []; }
}

export function matchTeam(list, name) {
  const n = norm(name); if (!n) return null;
  let hit = list.find((t) => t.names.includes(n));
  if (hit) return hit;
  hit = list.find((t) => t.names.some((x) => x && (x.includes(n) || n.includes(x))));
  if (hit) return hit;
  const last = n.split(" ").pop();
  return list.find((t) => t.names.some((x) => x && x.split(" ").pop() === last)) || null;
}

async function teamLog(sport, teamId, season) {
  const em = ESPN_MAP[sport]; if (!em) return [];
  const url = `https://site.api.espn.com/apis/site/v2/sports/${em.sp}/${em.lg}/teams/${teamId}/schedule?season=${season}&seasontype=2`;
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const j = await r.json();
    // Validate against requestedSeason — `season` echoes the league's CURRENT state.
    const rs = j.requestedSeason;
    if (rs && rs.year && String(rs.year) !== String(season)) return [];
    return parseLog(j, teamId);
  } catch { return []; }
}

// Early in a season the log is too short to say anything. Fall back to last season
// and label it, rather than reporting a 2-game "trend".
async function logFor(sport, teamId) {
  const yr = seasonYear(sport);
  let log = await teamLog(sport, teamId, yr);
  if (log.length >= MIN_LOG) return { log, season: yr, stale: false };
  const prev = await teamLog(sport, teamId, yr - 1);
  if (prev.length >= MIN_LOG) return { log: prev, season: yr - 1, stale: true };
  return { log, season: yr, stale: false };
}

// ── Shared: compact real form for a matchup. Used by /api/buildslip so Plok's
// per-pick reasons cite actual numbers instead of "looks solid".
export async function teamFormFor(sport, game) {
  const sp = String(sport||"").toLowerCase();
  if (!ESPN_MAP[sp]) return null;
  const ck = ["form", sp, game].join("|");
  const hit = cacheGet(ck);
  if (hit) return hit;
  try {
    const { away, home } = parseTeams(game);
    const teams = await espnTeams(sp);
    const aT = matchTeam(teams, away), hT = matchTeam(teams, home);
    if (!aT || !hT) return null;
    const [A, H] = await Promise.all([logFor(sp, aT.id), logFor(sp, hT.id)]);
    const pack = (t, R, venue) => {
      const f = formSplit(R.log);
      return { abbr: t.abbr, venue, season: R.season, stale: R.stale,
               record: f ? f.record : null, n: f ? f.n : 0, pf: f ? f.pf : null, pa: f ? f.pa : null,
               homeRecord: f ? f.homeRecord : null, awayRecord: f ? f.awayRecord : null };
    };
    const out = { away: pack(aT, A, "away"), home: pack(hT, H, "home") };
    cacheSet(ck, out);
    return out;
  } catch { return null; }
}

// ── Narration: the LLM writes prose about numbers the code already computed ─
const BET_FOCUS = {
  nrfi: "The user asked about NRFI (no run in the 1st inning). Lead with 1st-inning evidence: each starter's scoreless-first rate over his recent starts, and how often these offences score in the 1st. Team last-10 form and full-game totals are weak evidence for a 1st-inning market — say so rather than padding with them.",
  yrfi: "The user asked about YRFI (a run in the 1st inning). Lead with 1st-inning evidence: each starter's rate of allowing a 1st-inning run, and these offences' early scoring. Full-game form is weak evidence here — say so rather than padding with it.",
  ou_f5: "The user asked about a FIRST 5 INNINGS total. Lead with the starters — their recent ERA and how deep they go. The bullpens do not pitch this market; full-game totals include innings this bet does not.",
  ml_f5: "The user asked about a FIRST 5 INNINGS moneyline. Lead with the two starters, not the bullpens or the full-game record.",
  spread_f5: "The user asked about a FIRST 5 INNINGS run line. Lead with the starters and early scoring, not full-game margins.",
  ou_h1: "The user asked about a FIRST HALF total. Lead with first-half scoring pace; full-game totals include a half this bet does not.",
  ml_h1: "The user asked about a FIRST HALF moneyline. Lead with first-half performance, not the final-score record.",
  spread_h1: "The user asked about a FIRST HALF spread. Lead with first-half margins.",
  ou: "The user asked about the game TOTAL. Lead with how each side's recent results sit against tonight's number, and the hit count over the average.",
  ml: "The user asked about the MONEYLINE. Lead with form, venue split and the head-to-head.",
  spread: "The user asked about the SPREAD. Lead with recent margins against tonight's number and the venue split.",
  prop: "The user asked about a PLAYER PROP. Team form is weak evidence for one player — say so plainly if that is all the FACTS support.",
};

const SYS =
  "You are Plok's Trends & Form lens for a sports pick'em app. You explain FORM and TRENDS — recent results, " +
  "streaks, home/road splits, scoring pace, and how a team's recent results sit against tonight's posted number. " +
  "Rules: (1) Use ONLY the numbers in FACTS. Never invent, estimate or recall a stat. " +
  "(2) NEVER claim against-the-spread or over/under HISTORY — we do not have past closing lines. Where FACTS " +
  "describe tonight's number applied backwards over past results, describe it exactly that way (\"applying tonight's " +
  "number to their last 10\"), never as \"they're 6-4 ATS\" or \"the over is 6-4\". " +
  "(3) Trend language throughout — form, streak, splits, pace, last-N, home vs road. " +
  "(4) No prices, no stake sizes, no specific bet to place. A qualitative lean or angle is fine. " +
  "(5) Plain and confident. No hype, no emojis. " +
  "(6) Do not characterise scoring as high, low, strong or struggling unless that team's own number supports it. " +
  "Never apply one team's characteristic to both teams — if one side averages 3.1 and the other 5.2, they are not " +
  "both struggling. Read each side on its own numbers. " +
  "(7) Every figure you cite must appear in FACTS. FACTS is exactly what the user can see on screen, so do not " +
  "reference a split, average or record that is not there. " +
  "(8) Averages are PER GAME. Never restate a per-game average as a total across the sample. " +
  "(9) An average can hide skew — a team averaging 12.0 combined while clearing a 9.5 total in only 5 of 10 is " +
  "being carried by blowouts, not consistently going over. Lead with the hit count; treat the average as context. " +
  "Where the two disagree, say so plainly. " +
  "Return JSON: summary (2-3 sentences leading with the most decision-relevant trend); " +
  "bullCase (the strongest trend-based case FOR the side the form favours, anchored to specific numbers from FACTS); " +
  "bearCase (why the trend may not hold). The bearCase MUST identify and engage the single strongest number in " +
  "FACTS that points AGAINST the lean you took in bullCase, and name that number explicitly. If a team is averaging " +
  "12 combined runs against a 9.5 total, an under lean has to answer for it. Do not change the subject to a " +
  "different team or a different market. Beyond that: small sample, venue-driven splits, soft schedule, or the " +
  "posted number already reflecting the trend are all fair.";

const SCHEMA = {
  type: "object", additionalProperties: false,
  properties: { summary: { type: "string" }, bullCase: { type: "string" }, bearCase: { type: "string" } },
  required: ["summary", "bullCase", "bearCase"],
};

async function narrate(game, facts, bet) {
  if (!OPENAI) return null;
  const focus = bet && bet.betType && BET_FOCUS[bet.betType]
    ? `\n\nTHE BET: ${bet.selection || bet.betType}${bet.odds ? " at " + bet.odds : ""}. ${BET_FOCUS[bet.betType]} Every sentence must earn its place against THIS bet — do not write a generic matchup preview.`
    : "";
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI}` },
      body: JSON.stringify({
        model: "gpt-4o-mini", temperature: 0.4, max_tokens: 600,
        messages: [{ role: "system", content: SYS + focus }, { role: "user", content: `Matchup: ${game}\n\nFACTS:\n${facts}` }],
        response_format: { type: "json_schema", json_schema: { name: "trends", strict: true, schema: SCHEMA } },
      }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return JSON.parse(d.choices[0].message.content);
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const ctx = req.body || {};
    if (!ctx.game || !ctx.sport) return res.status(400).json({ error: "Missing game/sport" });
    if (ctx.userId && !(await isPro(ctx.userId))) return res.status(403).json({ error: "Plok is a Pro feature" });

    const sport = String(ctx.sport).toLowerCase();
    const lines = ctx.lines || {};
    const day = new Date().toISOString().slice(0, 10);
    // The bet is part of the key — otherwise asking NRFI after a moneyline on the same
    // game just replays the moneyline's cached writeup.
    const key = ["trends", sport, ctx.game, lines.total != null ? lines.total : "", (ctx.bet && ctx.bet.betType) || "game", day].join("|");
    const cached = cacheGet(key);
    if (cached) return res.status(200).json({ ...cached, cached: true });

    let matchup = null;
    try { matchup = await buildMatchup(sport, { game: ctx.game }); } catch { matchup = null; }

    // ── Game logs (1 fetch per team for a whole season) ──
    const { away, home } = parseTeams(ctx.game);
    const teams = await espnTeams(sport);
    const aT = matchTeam(teams, away), hT = matchTeam(teams, home);
    let aLog = [], hLog = [], stale = false, logSeason = null;
    if (aT && hT) {
      const [A, H] = await Promise.all([logFor(sport, aT.id), logFor(sport, hT.id)]);
      aLog = A.log; hLog = H.log;
      stale = A.stale || H.stale;
      logSeason = A.season;
    }
    const aAbbr = (aT && aT.abbr) || (matchup && matchup.away && matchup.away.abbr) || away;
    const hAbbr = (hT && hT.abbr) || (matchup && matchup.home && matchup.home.abbr) || home;

    let trends = trendBullets(sport, aAbbr, hAbbr, aLog, hLog, lines, away, home);

    // MLB: layer the starter/bullpen form on top — it's the sharpest data we have.
    let pack = null;
    if (sport === "mlb") {
      try { pack = await buildMlbPack({ game: ctx.game }); } catch { pack = null; }
      if (pack) {
        if (!matchup && pack.matchup) matchup = pack.matchup;
        trends = [...trends, ...mlbBullets(pack, matchup)];
      }
    }

    if (!trends.length && !matchup) {
      const out = { summary: "No completed games or standings are posted for this matchup yet, so there's no form to read. Check back closer to game time. This is form analysis, not betting advice.", keyStats: [], trends: [], matchup: null, model: "trends" };
      cacheSet(key, out);
      return res.status(200).json({ ...out, cached: false });
    }

    // keyStats: last-10 form, which is the headline number for this lens.
    const keyStats = [];
    const aF = formSplit(aLog), hF = formSplit(hLog);
    if (aF) keyStats.push({ value: aF.record, label: `${aAbbr} last ${aF.n}` });
    if (hF) keyStats.push({ value: hF.record, label: `${hAbbr} last ${hF.n}` });
    if (lines.total != null) {
      const aTs = totalSplit(aLog, lines.total), hTs = totalSplit(hLog, lines.total);
      if (aTs) keyStats.push({ value: `${aTs.all.o}/${aTs.all.n}`, label: `${aAbbr} over ${lines.total}` });
      if (hTs) keyStats.push({ value: `${hTs.all.o}/${hTs.all.n}`, label: `${hAbbr} over ${lines.total}` });
    }

    const factLines = [];
    if (stale && logSeason) factLines.push(`NOTE: too few completed games this season — the game log below is the ${logSeason} season. Say so.`);
    if (lines.total != null) factLines.push(`Tonight's posted total: ${lines.total}`);
    for (const s of (lines.spreads || [])) factLines.push(`Tonight's posted spread: ${s.team} ${sgn(s.point)}`);
    if (matchup) {
      const m = matchup;
      factLines.push(`${m.away.abbr} season: ${m.away.overall || "n/a"} (home ${m.away.home || "n/a"}, road ${m.away.away || "n/a"}, streak ${m.away.streak || "n/a"})`);
      factLines.push(`${m.home.abbr} season: ${m.home.overall || "n/a"} (home ${m.home.home || "n/a"}, road ${m.home.away || "n/a"}, streak ${m.home.streak || "n/a"})`);
      if (m.h2h) factLines.push(`${m.h2h.label}: ${m.away.abbr} ${m.h2h.away}, ${m.home.abbr} ${m.h2h.home}`);
    }
    if (pack) for (const l of (pack.lines || [])) factLines.push(`${l.label}: ${l.value}`);

    // For a 1st-inning market the starter NRFI bullets ARE the evidence — float them to
    // the top so they survive selection and lead the read.
    const bt = (ctx.bet && ctx.bet.betType) || null;
    if (bt === "nrfi" || bt === "yrfi") {
      const first = trends.filter((t) => /1st|scoreless|NRFI|YRFI/i.test(t.text));
      const rest = trends.filter((t) => !first.includes(t));
      trends = [...first, ...rest];
    }
    // Pick the visible set FIRST — the model narrates only what the user can see.
    const shown = bt === "nrfi" || bt === "yrfi" ? trends.slice(0, 8) : selectBullets(trends, 8);
    const factText = [...factLines, ...shown.map((t) => `- ${t.text}`)].join("\n");
    const gen = await narrate(ctx.game, factText, ctx.bet);

    const out = {
      summary: (gen && gen.summary) || (shown.length ? shown.slice(0, 2).map((t) => t.text).join(" ") : "Here's the recent form and season context for this matchup."),
      bullCase: (gen && gen.bullCase) || "",
      bearCase: (gen && gen.bearCase) || "",
      keyStats: keyStats.slice(0, 4),
      trends: shown,
      matchup, conviction: null, verdict: "none", model: "trends",
      logSeason, staleSeason: stale,
    };
    cacheSet(key, out);
    return res.status(200).json({ ...out, cached: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}