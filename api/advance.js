import { createClient } from "@supabase/supabase-js";

// Time-derived week roll-over + server-authoritative playoffs for h2h / points leagues.
// A "week" is 7 days from a league's season_start. When a week ends (plus grace), every
// matchup in that week is decided W/L from graded picks and current_week advances. Once
// the season reaches the playoff window, the bracket is seeded, advanced round by round,
// and a champion is crowned — all without anyone opening the app.
//
// (Standalone "bracket" leagues settle in grade.js; "solo" leagues never advance.)

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const GRACE_MS = 3 * 60 * 60 * 1000; // buffer so late finals grade before a week closes

let _notifyBase = "";
// Fire-and-forget "your week is final" push. Best-effort: never blocks finalization.
async function sendWeekResult(userId, won, myPts, oppPts, week, leagueName) {
  if (!_notifyBase || !process.env.CRON_SECRET) return;
  const mp = parseFloat(Number(myPts || 0).toFixed(1));
  const op = parseFloat(Number(oppPts || 0).toFixed(1));
  const body = (won ? "You won " : "You lost ") + mp + "\u2013" + op + " in " + (leagueName || "your league") + ".";
  try {
    await fetch(_notifyBase + "/api/notify", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.CRON_SECRET, "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId], title: "\uD83C\uDFC1 Week " + week + " is final", body: body, url: "/", category: "notif_results" }),
    });
  } catch (e) {}
}

// ── Playoff field/size helpers (ported verbatim from the client) ──────────────
function playoffSeeds(total) { const t = Number(total) || 0; return t >= 12 ? 8 : t >= 8 ? 6 : t >= 6 ? 4 : t >= 4 ? 2 : 0; }
// Explicit config (playoffs_enabled / playoff_size) wins; else smart default. Clamped to {2,4,6,8} and to participant count.
function playoffFieldFor(league, total) {
  const t = Number(total) || 0;
  if (league && league.playoffs_enabled === false) return 0;
  const cfg = league ? (Number(league.playoff_size) || 0) : 0;
  const cap = cfg > 0 ? Math.min(cfg, t) : t;
  if (cfg > 0) { const allowed = [2, 4, 6, 8].filter(v => v <= cap); return allowed.length ? allowed[allowed.length - 1] : 0; }
  return playoffSeeds(t);
}
function playoffWeeksFor(n) { return n >= 2 ? Math.ceil(Math.log2(n)) : 0; } // 2→1, 4→2, 6→3, 8→3

export default async function handler(req, res) {
  // Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).json({ error: "CRON_SECRET not set" });   // fail CLOSED
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // These names must match grade.js / closing.js (VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY).
  // The old names (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) were never set, which is why
  // this route used to 500 every run.
  const SB_URL = process.env.VITE_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: "supabase env not set (VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY)" });
  }
  const supabase = createClient(SB_URL, SB_KEY);
  _notifyBase = "https://" + (req.headers.host || process.env.VERCEL_URL || "lined-up-murex.vercel.app");

  try {
    const { data: leagues, error } = await supabase
      .from("leagues")
      .select("id, name, current_week, season_weeks, season_start, league_type, playoffs_enabled, playoff_size, champion_id, completed_at, survivor_lives, duration_days, target_size, slot_config")
      .not("season_start", "is", null)
      .eq("is_demo", false);
    if (error) throw error;

    const advanced = [];
    for (const lg of leagues || []) {
      const lt = lg.league_type || "h2h";
      if (lt === "bracket" || lt === "solo") continue; // bracket settles in grade.js; solo never advances
      if (lg.completed_at) continue; // season stamped complete — no more work, ever
      if (lt === "survivor") { await advanceSurvivor(supabase, lg, Math.min(seasonWeeksOf(lg) + 1, weekTargetOf(lg)), seasonWeeksOf(lg)); continue; }
      const start = new Date(lg.season_start).getTime();
      if (isNaN(start)) continue;

      const seasonWeeks = Number(lg.season_weeks || 18);
      // target may reach seasonWeeks+1 so the loop finalizes the FINAL week too;
      // current_week itself is always clamped to seasonWeeks.
      // Day-mode duels (duration_days set): the single "week" is duration_days long,
      // closing at the next 3:00 AM ET after start + N days so late West-Coast finals
      // settle inside the window. No extra grace: the 3 AM snap IS the grace.
      // A one-window duel is over the moment both slips are full and every leg has
      // graded — waiting on the calendar leaves a settled duel sitting "live" for
      // days. Rather than a separate completion path, this just advances the target
      // past the final week so the normal machinery below finalizes and stamps it.
      // season_weeks===1 only: a multi-week series has full graded slips at the end
      // of EVERY week and must keep playing them.
      const duelDone = Number(lg.target_size) === 2
        && (lg.league_type || "h2h") === "h2h"
        && Number(lg.season_weeks || 0) === 1
        && await duelSettled(supabase, lg);
      const target = duelDone
        ? (seasonWeeks + 1)
        : (Number(lg.duration_days)
            ? (Date.now() >= duelEndAt(start, lg.duration_days) ? seasonWeeks + 1 : 1)
            : Math.min(
                seasonWeeks + 1,
                Math.floor((Date.now() - start - GRACE_MS) / WEEK_MS) + 1
              ));
      const cw = lg.current_week || 1;

      if (target <= cw) {
        // No new week to roll, but the league may be sitting inside the playoff window:
        // seed it (so members see the bracket the moment the window opens), and keep any
        // in-flight rounds moving as their picks finish grading.
        await maybeSeedPlayoff(supabase, lg, cw);
        await advancePlayoffBracket(supabase, lg.id);
        await maybeCrownChampion(supabase, lg);
        await maybeComplete(supabase, lg, target, seasonWeeks);
        continue;
      }

      // Roll each closed week: seed when we reach the window, finalize the week from graded
      // picks, bump current_week, then advance the bracket. Mirrors the client pipeline.
      for (let wk = cw; wk < target; wk++) {
        await maybeSeedPlayoff(supabase, lg, wk);
        await finalizeWeek(supabase, lg.id, wk);
        await supabase.from("leagues").update({ current_week: Math.min(seasonWeeks, wk + 1) }).eq("id", lg.id);
        await advancePlayoffBracket(supabase, lg.id);
      }
      await maybeSeedPlayoff(supabase, lg, Math.min(seasonWeeks, target));
      await maybeCrownChampion(supabase, lg);
      await maybeComplete(supabase, lg, target, seasonWeeks);

      advanced.push({ league: lg.id, from: cw, to: Math.min(seasonWeeks, target) });
    }

    return res.status(200).json({ ok: true, advanced });
  } catch (err) {
    console.error("advance error", err);
    return res.status(500).json({ error: "advance failed" });
  }
}

// Decide W/L for a closed week from graded picks. Idempotent: only touches matchups that
// haven't been finalized yet (winner_id IS NULL). Skips bye/placeholder rows.
async function finalizeWeek(supabase, leagueId, week) {
  const { data: _lgRow } = await supabase.from("leagues").select("name").eq("id", leagueId).maybeSingle();
  const _leagueName = (_lgRow && _lgRow.name) || null;
  // Every pick for the week, not just the winners. Points still come only from wins,
  // but we also need to know WHO SHOWED UP: submitting nothing scored 0, and going
  // 0-for-8 scored 0, so the two were indistinguishable. With ties handed to user1 by
  // seat, a player who skipped the week could beat a player who actually played.
  const { data: weekPicks } = await supabase
    .from("picks").select("user_id, result, points_earned")
    .eq("league_id", leagueId).eq("week", week);

  const totals = {};
  const submitted = {};
  (weekPicks || []).forEach((p) => {
    submitted[p.user_id] = (submitted[p.user_id] || 0) + 1;
    if (p.result === "W") totals[p.user_id] = (totals[p.user_id] || 0) + parseFloat(p.points_earned || 0);
  });

  const { data: matchups } = await supabase
    .from("matchups").select("id, user1_id, user2_id")
    .eq("league_id", leagueId).eq("week", week).is("winner_id", null);

  for (const m of matchups || []) {
    if (!m.user1_id || !m.user2_id) continue; // bye / not-yet-seated slot
    const p1 = totals[m.user1_id] || 0;
    const p2 = totals[m.user2_id] || 0;
    const s1 = submitted[m.user1_id] || 0;
    const s2 = submitted[m.user2_id] || 0;
    // Points decide it. On a tie, showing up beats not showing up — otherwise a no-show
    // ties an 0-for-8 opponent, and wins outright whenever it happens to sit in seat 1.
    // Only a genuine tie between two players who both played falls back to seed order.
    let winner;
    if (p1 !== p2) winner = p1 > p2 ? m.user1_id : m.user2_id;
    else if (s1 !== s2) winner = s1 > s2 ? m.user1_id : m.user2_id;
    else winner = m.user1_id; // tie → user1 (better seed)

    await supabase.from("matchups").update({
      winner_id: winner,
      user1_points: parseFloat(p1.toFixed(1)),
      user2_points: parseFloat(p2.toFixed(1)),
    }).eq("id", m.id);

    for (const [uid, myPts, oppPts] of [[m.user1_id, p1, p2], [m.user2_id, p2, p1]]) {
      await supabase.from("users").update({
        pending_result: JSON.stringify({ won: winner === uid, myPts: parseFloat(myPts.toFixed(1)), oppPts: parseFloat(oppPts.toFixed(1)), week }),
      }).eq("id", uid);
      try { await sendWeekResult(uid, winner === uid, myPts, oppPts, week, _leagueName); } catch (e) {}
    }
  }
}

// Rank members for seeding: h2h by matchup wins (tiebreak total points), points by total points.
async function computeSeedOrder(supabase, leagueId, leagueType, n) {
  const { data: mem } = await supabase.from("league_members").select("user_id").eq("league_id", leagueId);
  const ids = (mem || []).map((m) => m.user_id);
  if (ids.length < 2) return [];
  const { data: picks } = await supabase.from("picks").select("user_id,result,points_earned").eq("league_id", leagueId).eq("result", "W");
  const pts = {}; ids.forEach((id) => (pts[id] = 0));
  (picks || []).forEach((p) => { if (pts[p.user_id] != null) pts[p.user_id] += parseFloat(p.points_earned || 0); });

  let rank;
  if ((leagueType || "h2h") === "h2h") {
    const { data: ms } = await supabase.from("matchups").select("winner_id,bracket_match_id").eq("league_id", leagueId);
    const wins = {}; ids.forEach((id) => (wins[id] = 0));
    (ms || []).forEach((m) => { if (!String(m.bracket_match_id || "").startsWith("PW") && m.winner_id && wins[m.winner_id] != null) wins[m.winner_id]++; });
    rank = ids.slice().sort((a, b) => (wins[b] - wins[a]) || (pts[b] - pts[a]));
  } else {
    rank = ids.slice().sort((a, b) => pts[b] - pts[a]);
  }
  return rank.slice(0, n);
}

// Build the single-elim bracket from seed order, padding to the next power of two so the
// top seeds get byes (6 teams → top 2 bye into round 2). Idempotent caller (maybeSeedPlayoff).
async function generatePlayoffBracket(supabase, leagueId, seededIds, startWeek) {
  const n = (seededIds || []).length;
  if (n < 2) return false;
  const P = 1 << Math.ceil(Math.log2(n)); // next power of 2 (6 → 8, with byes)
  let order = [1, 2];
  while (order.length < P) { const size = order.length * 2; const nx = []; for (const sd of order) { nx.push(sd); nx.push(size + 1 - sd); } order = nx; }
  const sw = Math.max(1, startWeek);
  await supabase.from("matchups").delete().eq("league_id", leagueId).gte("week", sw);
  const idOf = (k) => (k >= 1 && k <= n) ? (seededIds[k - 1] || null) : null;
  const rows = []; const r2 = {}; const r1 = P / 2;
  for (let i = 0; i < r1; i++) {
    const a = idOf(order[i * 2]), b = idOf(order[i * 2 + 1]);
    let win = null; if (a && !b) win = a; else if (b && !a) win = b; // unmatched seed = bye, auto-advances
    rows.push({ league_id: leagueId, week: sw, user1_id: a, user2_id: b, user1_points: 0, user2_points: 0, winner_id: win, bracket_match_id: `PW${sw}M${i + 1}` });
    if (win) { const ni = Math.ceil((i + 1) / 2); const seat = ((i + 1) % 2 === 1) ? "user1_id" : "user2_id"; (r2[ni] = r2[ni] || {})[seat] = win; }
  }
  let roundSize = r1, week = sw + 1, ridx = 2;
  while (roundSize > 1) {
    const matches = roundSize / 2;
    for (let i = 0; i < matches; i++) {
      const seed = (ridx === 2) ? (r2[i + 1] || {}) : {};
      rows.push({ league_id: leagueId, week, user1_id: seed.user1_id || null, user2_id: seed.user2_id || null, user1_points: 0, user2_points: 0, winner_id: null, bracket_match_id: `PW${week}M${i + 1}` });
    }
    roundSize = matches; week++; ridx++;
  }
  const { error } = await supabase.from("matchups").insert(rows);
  if (error) console.warn("[advance] playoff seed insert failed:", error.message || error);
  return !error;
}

// Seed the bracket once the season reaches the playoff window. Idempotent: bails if a PW
// matchup already exists for the window.
async function maybeSeedPlayoff(supabase, league, curWeek) {
  if ((league.league_type || "h2h") === "bracket") return;
  const { data: mem } = await supabase.from("league_members").select("user_id").eq("league_id", league.id);
  const N = playoffFieldFor(league, (mem || []).length);
  if (N < 2) return;
  const pWeeks = playoffWeeksFor(N);
  const sw = Math.max(1, (Number(league.season_weeks) || 18) - pWeeks + 1);
  if (curWeek < sw) return;
  const { data: ex } = await supabase.from("matchups").select("bracket_match_id").eq("league_id", league.id).gte("week", sw);
  if ((ex || []).some((m) => String(m.bracket_match_id || "").startsWith("PW"))) return;
  const seeded = await computeSeedOrder(supabase, league.id, league.league_type, N);
  if (seeded.length === N) await generatePlayoffBracket(supabase, league.id, seeded, sw);
}

// Ascending pass: finalize each closed playoff round, then propagate winners into the next
// round's seats. Idempotent.
async function advancePlayoffBracket(supabase, leagueId) {
  const { data: lg } = await supabase.from("leagues").select("current_week").eq("id", leagueId).maybeSingle();
  const cw = (lg && lg.current_week) || 1;
  let { data } = await supabase.from("matchups").select("*").eq("league_id", leagueId);
  let pw = (data || []).filter((m) => String(m.bracket_match_id || "").startsWith("PW"));
  if (!pw.length) return;
  const parse = (id) => { const t = String(id || ""); if (t.slice(0, 2) !== "PW") return null; const mi = t.indexOf("M"); if (mi < 0) return null; const w = parseInt(t.slice(2, mi), 10); const i = parseInt(t.slice(mi + 1), 10); return (w && i) ? { w, i } : null; };
  const weeks = [...new Set(pw.map((m) => m.week))].sort((a, b) => a - b);
  for (const w of weeks) {
    if (w < cw) {
      const open = pw.filter((m) => m.week === w && !m.winner_id && m.user1_id && m.user2_id);
      if (open.length) {
        await finalizeWeek(supabase, leagueId, w);
        const { data: d2 } = await supabase.from("matchups").select("*").eq("league_id", leagueId);
        pw = (d2 || []).filter((m) => String(m.bracket_match_id || "").startsWith("PW"));
      }
    }
    const byKey = {}; pw.forEach((m) => { const k = parse(m.bracket_match_id); if (k) byKey[k.w + "_" + k.i] = m; });
    const decided = pw.filter((m) => m.week === w && m.winner_id);
    for (const m of decided) {
      const k = parse(m.bracket_match_id); if (!k) continue;
      const nextM = byKey[(w + 1) + "_" + Math.ceil(k.i / 2)];
      if (!nextM) continue;
      const seat = (k.i % 2 === 1) ? "user1_id" : "user2_id";
      if (nextM[seat] !== m.winner_id) {
        await supabase.from("matchups").update({ [seat]: m.winner_id }).eq("id", nextM.id);
        nextM[seat] = m.winner_id;
      }
    }
  }
}

// Persist the champion when the final resolves. Idempotent.
async function maybeCrownChampion(supabase, league) {
  if (league && league.champion_id) return;
  const { data: ms } = await supabase.from("matchups").select("week,winner_id,bracket_match_id").eq("league_id", league.id);
  const pw = (ms || []).filter((m) => String(m.bracket_match_id || "").startsWith("PW"));
  if (!pw.length) return;
  const lastWk = Math.max.apply(null, pw.map((m) => m.week));
  const finals = pw.filter((m) => m.week === lastWk);
  if (finals.length === 1 && finals[0].winner_id) {
    await supabase.from("leagues").update({ champion_id: finals[0].winner_id, completed_at: new Date().toISOString() }).eq("id", league.id);
  }
}

// Stamp completed_at once a season is definitively over. Two paths end a season:
// a playoff final resolves (maybeCrownChampion / settleBracketRound stamp it in the
// same write as champion_id), or a league with NO playoff field runs out the clock
// on its final week — that path is handled here, crowning the standings leader so
// every finished league has a champion. Also backstops any league whose champion
// was crowned before completed_at existed. Idempotent; once stamped, the top-of-loop
// guard stops all future advance/grade/remind work on the league.
async function maybeComplete(supabase, league, target, seasonWeeks) {
  if (league.completed_at) return;
  if (league.champion_id) {
    await supabase.from("leagues").update({ completed_at: new Date().toISOString() }).eq("id", league.id);
    return;
  }
  if (target <= seasonWeeks) return; // final week hasn't closed yet
  const { data: mem } = await supabase.from("league_members").select("user_id").eq("league_id", league.id);
  const field = playoffFieldFor(league, (mem || []).length);
  if (field >= 2) return; // playoffs decide this league; the final's resolution stamps it
  // 2-player duels settle by their own chain: weekly wins -> total points -> highest
  // single week -> dead heat (completed with champion_id NULL; client prompts a
  // run-it-back). Weekly wins are recomputed from stored matchup POINTS, not
  // winner_id: finalizeWeek hands genuine ties to seat 1 for bracket bookkeeping,
  // and a tied week must award NO series point here.
  if ((mem || []).length === 2) {
    const champ = await duelOutcome(supabase, league.id, (mem || []).map((m) => m.user_id));
    await supabase.from("leagues").update({
      champion_id: champ,
      completed_at: new Date().toISOString(),
    }).eq("id", league.id);
    return;
  }
  const top = await computeSeedOrder(supabase, league.id, league.league_type, 1);
  await supabase.from("leagues").update({
    champion_id: (top && top[0]) || null,
    completed_at: new Date().toISOString(),
  }).eq("id", league.id);
}

// True when a duel can no longer change: both seats have a full slip and no pick
// is still pending. Slot count comes from slot_config, matching the client's
// `_cfg ? _cfg.length : 5` default so the two agree on what "full" means.
async function duelSettled(supabase, lg) {
  try {
    const { data: mem } = await supabase
      .from("league_members").select("user_id").eq("league_id", lg.id);
    if (!mem || mem.length !== 2) return false;
    const { data: picks } = await supabase
      .from("picks").select("user_id, slot, result").eq("league_id", lg.id);
    const live = (picks || []).filter((p) => p.result !== "P");
    if (!live.length) return false;
    if (live.some((p) => p.result === "pending")) return false;
    let cfg = lg.slot_config;
    if (typeof cfg === "string") { try { cfg = JSON.parse(cfg); } catch (e) { cfg = null; } }
    const need = Array.isArray(cfg) && cfg.length ? cfg.length : 5;
    const slotKey = (sl) => {
      const m = String(sl || "").match(/^longshot_(\d+)_/);
      return m ? "longshot_" + m[1] : String(sl || "");
    };
    for (const m of mem) {
      const n = new Set(live.filter((p) => p.user_id === m.user_id).map((p) => slotKey(p.slot))).size;
      if (n < need) return false;
    }
    return true;
  } catch (e) { return false; }
}

// Next instant at/after `ms` where it is exactly 3:00 AM in America/New_York.
// ET offsets are whole hours, so zeroing minutes at the matched hour lands on :00 ET.
function snap3amET(ms) {
  for (let i = 0; i < 48; i++) {
    const t = ms + i * 3600000;
    const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }).format(new Date(t)));
    if (h === 3) { const d = new Date(t); d.setMinutes(0, 0, 0); return d.getTime(); }
  }
  return ms;
}
function duelEndAt(startMs, days) {
  return snap3amET(startMs + Number(days) * 24 * 60 * 60 * 1000);
}

// 2-player settlement chain. Returns the champion's id, or null for a dead heat.
async function duelOutcome(supabase, leagueId, ids) {
  const a = ids[0], b = ids[1];
  const { data: ms } = await supabase
    .from("matchups").select("user1_id, user2_id, user1_points, user2_points, bracket_match_id, winner_id")
    .eq("league_id", leagueId);
  const wins = {}; wins[a] = 0; wins[b] = 0;
  (ms || []).forEach((m) => {
    if (String(m.bracket_match_id || "").startsWith("PW")) return;
    if (m.winner_id == null) return; // week not finalized
    const p1 = parseFloat(m.user1_points || 0), p2 = parseFloat(m.user2_points || 0);
    if (p1 === p2) return; // tied week: no series point to either side
    const w = p1 > p2 ? m.user1_id : m.user2_id;
    if (wins[w] != null) wins[w]++;
  });
  if (wins[a] !== wins[b]) return wins[a] > wins[b] ? a : b;

  const { data: picks } = await supabase
    .from("picks").select("user_id, week, points_earned")
    .eq("league_id", leagueId).eq("result", "W");
  const tot = {}; tot[a] = 0; tot[b] = 0; const byWk = {};
  (picks || []).forEach((p) => {
    const v = parseFloat(p.points_earned || 0);
    if (tot[p.user_id] != null) tot[p.user_id] += v;
    const k = p.user_id + "|" + p.week;
    byWk[k] = (byWk[k] || 0) + v;
  });
  if (Math.abs(tot[a] - tot[b]) > 1e-9) return tot[a] > tot[b] ? a : b;

  const best = (id) => Object.keys(byWk).filter((k) => k.indexOf(id + "|") === 0)
    .reduce((mx, k) => Math.max(mx, byWk[k]), 0);
  const ba = best(a), bb = best(b);
  if (Math.abs(ba - bb) > 1e-9) return ba > bb ? a : b;
  return null; // dead heat
}

// ── Survivor ─────────────────────────────────────────────────────────────────
const seasonWeeksOf = (lg) => Number(lg.season_weeks || 18);
const weekTargetOf = (lg) => Math.floor((Date.now() - new Date(lg.season_start).getTime() - GRACE_MS) / WEEK_MS) + 1;

async function sendElimination(userId, week, leagueName) {
  if (!_notifyBase || !process.env.CRON_SECRET) return;
  try {
    await fetch(_notifyBase + "/api/notify", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.CRON_SECRET, "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId], title: "You're out \u2014 Week " + week, body: (leagueName || "Your survivor pool") + " moved on without you. The Board remembers.", url: "/", category: "notif_results" }),
    });
  } catch (e) {}
}

async function sendLifeBurned(userId, week, leagueName) {
  if (!_notifyBase || !process.env.CRON_SECRET) return;
  try {
    await fetch(_notifyBase + "/api/notify", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.CRON_SECRET, "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId], title: "Life burned \u2014 Week " + week, body: (leagueName || "Your survivor pool") + " took one of your two lives. One left \u2014 make it count.", url: "/", category: "notif_results" }),
    });
  } catch (e) {}
}

// Weekly survivor settlement. Rules:
//  - a member survives a closed week iff they have at least one W pick that week
//  - no pick, or all losses -> a STRIKE; eliminated_week lands the week strikes
//    reach the pool's survivor_lives (1 = sudden death, 2 = one mulligan) --
//    strikes are recomputed from picks every pass and persisted to
//    league_members.survivor_strikes so the client never re-derives settlement
//  - FULL WIPEOUT: if every alive member busts the same week, nobody dies
//  - any alive member still pending in a week HOLDS settlement (never eliminate
//    on grading lag) — weeks settle strictly in order, retried every cron pass
//  - champion: last one standing (season ends early), or best total points among
//    the alive when the clock runs out; completed_at stamps in the same write
// current_week still rolls on time so the next week's board opens regardless.
async function advanceSurvivor(supabase, lg, target, seasonWeeks) {
  const cw = lg.current_week || 1;
  if (target > cw) {
    await supabase.from("leagues").update({ current_week: Math.min(seasonWeeks, target) }).eq("id", lg.id);
  }
  const { data: mem } = await supabase.from("league_members").select("user_id, eliminated_week, survivor_strikes").eq("league_id", lg.id);
  let alive = (mem || []).filter((m) => m.eliminated_week == null).map((m) => m.user_id);
  if (!alive.length) return;
  // A pool of one is not a pool. Without this, the "last one standing" branch below
  // is true on the very first cron pass -- the sole member gets crowned champion and
  // completed_at is stamped on a pool that never started, which the client then
  // correctly renders as "in the books". Nobody has been eliminated; nobody has won.
  if ((mem || []).length < 2) return;

  const lastClosed = Math.min(seasonWeeks, target - 1);
  const { data: pk } = await supabase.from("picks").select("user_id, week, result, points_earned").eq("league_id", lg.id).lte("week", Math.max(1, lastClosed));
  const byWeek = {};
  for (const p of pk || []) {
    const wRow = (byWeek[p.week] = byWeek[p.week] || {});
    (wRow[p.user_id] = wRow[p.user_id] || []).push(p.result);
  }

  const lives = Math.max(1, Math.min(2, Number(lg.survivor_lives) || 1));
  const prevStrikes = {}; (mem || []).forEach((m) => { prevStrikes[m.user_id] = Number(m.survivor_strikes) || 0; });
  const strikes = {}; alive.forEach((u) => (strikes[u] = 0));
  for (let w = 1; w <= lastClosed && alive.length > 1; w++) {
    const wp = byWeek[w] || {};
    if (alive.some((u) => (wp[u] || []).some((r) => r == null || r === "pending"))) break; // grading lag (incl. NULL): hold this and later weeks
    const busted = alive.filter((u) => {
      const rs = wp[u] || [];
      if (rs.includes("W")) return false;          // hit -> survive clean
      if (rs.length && rs.every((r) => r === "P")) return false; // voided (scratch / cancelled) -> survive, never charge a pick that could not win
      return true;                                  // no pick, or a real miss
    });
    if (!busted.length) continue;
    if (busted.length === alive.length) continue; // full wipeout: the week is a wash -- no strikes, nobody dies
    const out = [];
    for (const u of busted) {
      strikes[u] = (strikes[u] || 0) + 1;
      if (strikes[u] >= lives) out.push(u);        // final strike lands: eliminated THIS week
    }
    for (const u of out) {
      const { data: upd } = await supabase.from("league_members")
        .update({ eliminated_week: w }).eq("league_id", lg.id).eq("user_id", u)
        .is("eliminated_week", null).select("user_id");
      if (upd && upd.length) { try { await sendElimination(u, w, lg.name); } catch (e) {} }
    }
    // Life-burned push for survivors of a strike -- only when the count INCREASED
    // versus what a prior pass persisted, so cron re-runs never re-notify.
    for (const u of busted) {
      if (!out.includes(u) && strikes[u] > (prevStrikes[u] || 0)) { try { await sendLifeBurned(u, w, lg.name); } catch (e) {} }
    }
    alive = alive.filter((u) => !out.includes(u));
  }
  // Persist computed strikes where changed. Only members alive at loop start are in
  // the map, so counts frozen at prior eliminations are never rewritten.
  for (const u of Object.keys(strikes)) {
    if (strikes[u] !== (prevStrikes[u] || 0)) {
      await supabase.from("league_members").update({ survivor_strikes: strikes[u] }).eq("league_id", lg.id).eq("user_id", u);
    }
  }

  if (lg.champion_id || lg.completed_at) return;
  // Crown only if somebody actually got eliminated to produce this survivor.
  if (alive.length === 1 && (mem || []).length > 1) {
    await supabase.from("leagues").update({ champion_id: alive[0], completed_at: new Date().toISOString() }).eq("id", lg.id);
    return;
  }
  if (target > seasonWeeks && alive.length > 1) {
    if ((pk || []).some((p) => p.result == null || p.result === "pending")) return; // settle everything first (NULL counts as ungraded)
    const pts = {}; alive.forEach((u) => (pts[u] = 0));
    for (const p of pk || []) if (p.result === "W" && pts[p.user_id] != null) pts[p.user_id] += parseFloat(p.points_earned || 0);
    const top = alive.slice().sort((a, b) => pts[b] - pts[a])[0];
    await supabase.from("leagues").update({ champion_id: top || null, completed_at: new Date().toISOString() }).eq("id", lg.id);
  }
}