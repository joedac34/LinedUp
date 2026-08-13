/**
 * /api/grade.js
 * Auto-grades pending picks for all leagues using The Odds API scores.
 * Called by Vercel cron (see vercel.json) every hour during game days.
 * Can also be triggered manually via POST /api/grade?secret=YOUR_CRON_SECRET
 *
 * Grades: ml, spread, ou, longshot legs
 * Skips:  prop (requires player stats — still manual)
 */

const SPORT_KEYS = {
  nfl: "americanfootball_nfl",
  nba: "basketball_nba",
  mlb: "baseball_mlb",
  ncaaf: "americanfootball_ncaaf",
};

// ── Supabase REST helpers ─────────────────────────────────────────────────────
const SB_URL = process.env.VITE_SUPABASE_URL;
// Set once per invocation from the incoming request (see handler). Vercel's
// VERCEL_URL points at the deployment alias rather than the production domain,
// so calling ourselves through it can hit a different build than the one running.
let PUSH_BASE = null;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key
const SB_ANON = process.env.VITE_SUPABASE_ANON_KEY;

const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function sbGet(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders });
  return r.json();
}

async function sbPatch(path, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: sbHeaders,
    body: JSON.stringify(body),
  });
  return r.json();
}

async function sbPost(path, body) {
  try {
    await fetch(`${SB_URL}/rest/v1/${path}`, { method: "POST", headers: { ...sbHeaders, Prefer: "return=minimal" }, body: JSON.stringify(body) });
  } catch (e) { /* never let a notification failure break grading */ }
}
async function sbUpsert(path, body) {
  try {
    await fetch(`${SB_URL}/rest/v1/${path}`, { method: "POST", headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(body) });
  } catch (e) { /* swallow */ }
}
// Per-run cache of each user's "Picks Graded" notification preference so we only
// look up each user once. Cleared at the start of every grade run (see handler)
// so a toggle change is respected on the next run even on a warm container.
const _notifPrefCache = new Map();
async function wantsGradeNotif(userId) {
  if (!userId) return false;
  if (_notifPrefCache.has(userId)) return _notifPrefCache.get(userId);
  let want = true; // default ON when the column is null/missing
  try {
    const rows = await sbGet(`users?id=eq.${userId}&select=notif_grades`);
    if (Array.isArray(rows) && rows.length) want = rows[0].notif_grades !== false;
  } catch (e) { want = true; }
  _notifPrefCache.set(userId, want);
  return want;
}
async function notifyPick(pick, league, result, pts, legs) {
  try {
    if (!(await wantsGradeNotif(pick.user_id))) return; // respects the "Picks Graded" toggle
    const won = result === "W";
    const what = legs > 1 ? `${legs}-leg parlay` : pick.pick_name;
    await sbPost("notifications", {
      user_id: pick.user_id,
      type: won ? "pick_win" : "pick_loss",
      title: won ? "Pick won" : "Pick lost",
      body: `${what}${won ? ` won — +${pts} pts` : " lost"}`,
      data: { league_id: pick.league_id, week: pick.week, result, points: pts, league_name: (league && league.name) || "" },
      created_at: new Date().toISOString(),
    });
  } catch (e) { /* swallow */ }
}
// "Cannizzop just passed you." The single most engaging notification in a pick'em
// league, and also the easiest one to turn into spam: ranks churn on every graded
// pick during a slate, so a naive version fires every time two people trade places.
//
// Three guards keep it sane:
//   1. ONE notification per (user, week, passer). If they trade places six times on
//      a Sunday, you hear about it once.
//   2. Only the person who LOST ground is told. Notifying the passer too would
//      double the volume for the same event and reads as gloating-by-robot.
//   3. Solo and one-person leagues are skipped — there is nobody to pass.
async function maybeNotifyPassed(league, oldRanks, ranked) {
  try {
    if (!league || !league.id || league.league_type === "solo") return;
    if (!oldRanks || !ranked || ranked.length < 2) return;
    const week = league.current_week;

    // Who dropped, and who is now directly above them.
    const drops = [];
    ranked.forEach(([uid], idx) => {
      const newRank = idx + 1;
      const oldRank = oldRanks[uid];
      if (!oldRank || newRank <= oldRank) return;      // new entrant, or held/improved
      const passerUid = ranked[idx - 1] && ranked[idx - 1][0];
      if (!passerUid || passerUid === uid) return;
      // Only count it if the passer actually came from below them.
      const passerOld = oldRanks[passerUid];
      if (!passerOld || passerOld <= oldRank) return;
      drops.push({ uid, passerUid, newRank });
    });
    if (!drops.length) return;

    const uids = [...new Set(drops.map(d => d.uid))];
    const prefRows = await sbGet(`users?id=in.(${uids.join(",")})&select=id,notif_results`);
    const optOut = new Set((Array.isArray(prefRows) ? prefRows : []).filter(u => u.notif_results === false).map(u => u.id));

    const already = await sbGet(`notifications?type=eq.passed&user_id=in.(${uids.join(",")})&select=user_id,data`);
    const seen = new Set((Array.isArray(already) ? already : [])
      .filter(n => n.data && n.data.league_id === league.id && String(n.data.week) === String(week))
      .map(n => `${n.user_id}|${n.data.by}`));

    // Names for the passers, one lookup for the whole batch.
    const passerIds = [...new Set(drops.map(d => d.passerUid))];
    const nameRows = await sbGet(`users?id=in.(${passerIds.join(",")})&select=id,username`);
    const nameById = {};
    (Array.isArray(nameRows) ? nameRows : []).forEach(u => { nameById[u.id] = u.username || "Someone"; });

    for (const d of drops) {
      if (optOut.has(d.uid)) continue;
      if (seen.has(`${d.uid}|${d.passerUid}`)) continue;
      const who = nameById[d.passerUid] || "Someone";
      const title = `${who} passed you`;
      const body = `You're now #${d.newRank} in ${league.name || "your league"}.`;
      await sbPost("notifications", {
        user_id: d.uid, type: "passed", title, body,
        data: { league_id: league.id, week, by: d.passerUid, rank: d.newRank },
        created_at: new Date().toISOString(),
      });
      await pushNotify(d.uid, title, body, "notif_results", "/");
    }
  } catch (e) { /* never break grading */ }
}
// Snapshot each member's cumulative league rank for the current week, so the
// weekly recap can show week-over-week movement. Ranks by total points across
// all graded picks. Service-role upsert (bypasses RLS). Best-effort.
async function stashWeekRanks(league) {
  try {
    if (!league || !league.id || !league.current_week) return;
    const rows = await sbGet(`picks?league_id=eq.${league.id}&result=in.(W,L)&select=user_id,points_earned`);
    if (!Array.isArray(rows) || !rows.length) return;
    const totals = {};
    for (const r of rows) { if (!r.user_id) continue; totals[r.user_id] = (totals[r.user_id] || 0) + (parseFloat(r.points_earned) || 0); }
    const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const week = league.current_week;
    // Read the standing BEFORE the upsert below overwrites it — this row IS the
    // previous state, and there is no history table to fall back on.
    let oldRanks = null;
    try {
      const prev = await sbGet(`weekly_ranks?league_id=eq.${league.id}&week=eq.${week}&select=user_id,rank`);
      if (Array.isArray(prev) && prev.length) {
        oldRanks = {};
        prev.forEach(r => { oldRanks[r.user_id] = r.rank; });
      }
    } catch (e) { oldRanks = null; }
    const payload = ranked.map(([user_id, pts], idx) => ({ league_id: league.id, user_id, week, rank: idx + 1, points: parseFloat(pts.toFixed(1)) }));
    if (payload.length) await sbUpsert("weekly_ranks?on_conflict=league_id,user_id,week", payload);
    // After the write, so a failed upsert cannot produce a notification about a
    // standing that was never recorded.
    if (oldRanks) await maybeNotifyPassed(league, oldRanks, ranked);
  } catch (e) { /* never break grading */ }
}
// Fire a real push alongside the in-app row. Everything in this file writes to the
// `notifications` table, which only feeds the bell icon — nothing here has ever sent
// a push. /api/notify owns both transports (Web Push + APNs) and re-checks the
// user's category preference itself, so this is a fan-out, not a second policy.
//
// Best-effort by construction: grading correctness outranks a notification, so a
// failure here is swallowed and never propagates. No await on the response body.
async function pushNotify(userIds, title, body, category, url) {
  try {
    const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
    if (!ids.length || !process.env.CRON_SECRET) return;
    const base = PUSH_BASE;
    if (!base) return;
    await fetch(base + '/api/notify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds: ids, title, body, url: url || '/', category }),
    });
  } catch (e) { /* never break grading for a notification */ }
}
// Fire a one-time "your week is in" tease when a user has no pending picks left
// for the week. Respects the notif_results ("Weekly Results") toggle and never
// double-sends (checks for an existing week_recap notification first).
async function maybeNotifyRecap(userId, league, week) {
  try {
    if (!userId) return;
    let want = true;
    try { const u = await sbGet(`users?id=eq.${userId}&select=notif_results`); if (Array.isArray(u) && u.length) want = u[0].notif_results !== false; } catch (e) {}
    if (!want) return;
    const existing = await sbGet(`notifications?user_id=eq.${userId}&type=eq.week_recap&select=data`);
    if (Array.isArray(existing) && existing.some(n => n.data && String(n.data.week) === String(week) && n.data.league_id === league.id)) return;
    const wk = await sbGet(`picks?league_id=eq.${league.id}&week=eq.${week}&user_id=eq.${userId}&result=in.(W,L)&select=result,points_earned`);
    const arr = Array.isArray(wk) ? wk : [];
    if (!arr.length) return;
    const wins = arr.filter(p => p.result === "W").length, losses = arr.filter(p => p.result === "L").length;
    const pts = arr.reduce((a, p) => a + (parseFloat(p.points_earned) || 0), 0);
    const recapTitle = `Your Week ${week} recap is in`;
    const recapBody = `You went ${wins}-${losses} for ${pts >= 0 ? "+" : ""}${pts.toFixed(1)} pts — tap to see your week.`;
    await sbPost("notifications", {
      user_id: userId, type: "week_recap",
      title: recapTitle,
      body: recapBody,
      data: { league_id: league.id, week, record: `${wins}-${losses}`, points: parseFloat(pts.toFixed(1)) },
      created_at: new Date().toISOString(),
    });
    // Push fires only here, once per user per week — deliberately NOT in notifyPick().
    // The dedup guard above (existing week_recap row) already ran, so this cannot
    // re-send on the next cron minute.
    await pushNotify(userId, recapTitle, recapBody, "notif_results", "/");
  } catch (e) { /* never break grading */ }
}
// When a league's week is fully sealed, nudge the COMMISH (once) to share the league
// recap card to the group. Skips solo leagues and one-person leagues. Dedup per week.
async function maybeNotifyCommishShare(league, week) {
  try {
    if (!league || !league.id) return;
    if (league.league_type === "solo") return;
    const lg = await sbGet(`leagues?id=eq.${league.id}&select=commissioner_id,name`);
    const commish = Array.isArray(lg) && lg[0] ? lg[0].commissioner_id : null;
    if (!commish) return;
    const mem = await sbGet(`league_members?league_id=eq.${league.id}&select=user_id`);
    if (!Array.isArray(mem) || mem.length < 2) return; // not a real group
    let want = true;
    try { const u = await sbGet(`users?id=eq.${commish}&select=notif_results`); if (Array.isArray(u) && u.length) want = u[0].notif_results !== false; } catch (e) {}
    if (!want) return;
    const existing = await sbGet(`notifications?user_id=eq.${commish}&type=eq.league_recap_share&select=data`);
    if (Array.isArray(existing) && existing.some(n => n.data && String(n.data.week) === String(week) && n.data.league_id === league.id)) return;
    const lname = (Array.isArray(lg) && lg[0] && lg[0].name) || league.name || "your league";
    await sbPost("notifications", {
      user_id: commish, type: "league_recap_share",
      title: `Week ${week} is in the books`,
      body: `Share the ${lname} recap — tap to post the week to your group.`,
      data: { league_id: league.id, week, league_name: lname },
      created_at: new Date().toISOString(),
    });
  } catch (e) { /* never break grading */ }
}
// Tie-break a bracket matchup: more correct picks that week, then the higher
// seed (user1, which holds the better bracket position).
async function bracketTiebreak(league, week, u1, u2) {
  try {
    const rows = await sbGet(`picks?league_id=eq.${league.id}&week=eq.${week}&result=eq.W&select=user_id`);
    let c1 = 0, c2 = 0;
    for (const r of (Array.isArray(rows) ? rows : [])) { if (r.user_id === u1) c1++; else if (r.user_id === u2) c2++; }
    return c1 >= c2 ? u1 : u2;
  } catch (e) { return u1; }
}
// Single-elimination settlement. When a round's week is fully graded: decide each
// matchup by weekly points, write winner_id, advance winners into the next round
// (bracket_match_id W{r}M{k} feeds W{r+1}M{ceil(k/2)}), bump the league's week, and
// crown a champion when the final resolves. Idempotent + server-authoritative.
async function settleBracketRound(league, week) {
  try {
    if (!league || !league.id || (league.league_type || "h2h") !== "bracket" || !week) return;
    // Round isn't over until no picks for the week are still pending.
    const pend = await sbGet(`picks?league_id=eq.${league.id}&week=eq.${week}&result=eq.pending&select=id&limit=1`);
    if (Array.isArray(pend) && pend.length) return;
    const ms = await sbGet(`matchups?league_id=eq.${league.id}&week=eq.${week}&select=id,user1_id,user2_id,winner_id,bracket_match_id`);
    if (!Array.isArray(ms) || !ms.length) return;
    // Weekly points per user (from winning picks).
    const won = await sbGet(`picks?league_id=eq.${league.id}&week=eq.${week}&result=eq.W&select=user_id,points_earned`);
    const totals = {};
    for (const p of (Array.isArray(won) ? won : [])) { if (p.user_id) totals[p.user_id] = (totals[p.user_id] || 0) + (parseFloat(p.points_earned) || 0); }
    // Decide winners for any matchup that has both players and no winner yet.
    const winners = {};
    for (const m of ms) {
      if (!m.user1_id || !m.user2_id) continue;
      let winnerId = m.winner_id;
      if (!winnerId) {
        const p1 = totals[m.user1_id] || 0, p2 = totals[m.user2_id] || 0;
        winnerId = p1 > p2 ? m.user1_id : (p2 > p1 ? m.user2_id : await bracketTiebreak(league, week, m.user1_id, m.user2_id));
        await sbPatch(`matchups?id=eq.${m.id}`, { winner_id: winnerId, user1_points: parseFloat(p1.toFixed(1)), user2_points: parseFloat(p2.toFixed(1)) });
      }
      winners[m.bracket_match_id] = winnerId;
    }
    // Advance into the next round, or crown a champion if there is none.
    const nextWeek = week + 1;
    const nextMs = await sbGet(`matchups?league_id=eq.${league.id}&week=eq.${nextWeek}&select=id,bracket_match_id,user1_id,user2_id`);
    if (Array.isArray(nextMs) && nextMs.length) {
      const nextById = {};
      for (const nm of nextMs) nextById[nm.bracket_match_id] = nm;
      for (const m of ms) {
        const mm = /W(\d+)M(\d+)/.exec(m.bracket_match_id || "");
        if (!mm) continue;
        const k = parseInt(mm[2]);
        const parent = nextById["W" + nextWeek + "M" + Math.ceil(k / 2)];
        const slot = (k % 2 === 1) ? "user1_id" : "user2_id";
        const winnerId = winners[m.bracket_match_id];
        if (parent && winnerId && !parent[slot]) {
          await sbPatch(`matchups?id=eq.${parent.id}`, { [slot]: winnerId });
          parent[slot] = winnerId;
        }
      }
      if (league.current_week === week) await sbPatch(`leagues?id=eq.${league.id}`, { current_week: nextWeek });
    } else if (ms.length === 1) {
      // Final round — single matchup. Its winner is the champion.
      const championId = winners[ms[0].bracket_match_id];
      if (championId) {
        await sbPatch(`leagues?id=eq.${league.id}`, { champion_id: championId, completed_at: new Date().toISOString() });
        await sbPost("notifications", {
          user_id: championId, type: "champion",
          title: "You won the tournament",
          body: (league.name ? league.name + " — " : "") + "You're the champion. Tap to see the bracket.",
          data: { league_id: league.id },
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) { /* never break grading */ }
}

// ── Scores fetcher ────────────────────────────────────────────────────────────
async function fetchScores(sportKey) {
  const apiKey = process.env.ODDS_API_KEY;
  // daysFrom=3 gets games completed in last 3 days
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores?apiKey=${apiKey}&daysFrom=3&dateFormat=iso`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Scores API ${r.status}`);
  return r.json();
}

// ── ESPN scoreboard fetcher (LIVE + recent finals; free, no Odds API usage) ────
// Returns games in the same shape the grader expects, plus an `inProgress` flag
// and live scores so an Over can be graded the moment it clears its line.
async function fetchScoresESPN(sport) {
  const em = ESPN_MAP[sport];
  if (!em) return [];
  const now = Date.now();
  const days = [];
  for (let i = -1; i <= 2; i++) { // tomorrow..3 days back (covers tz edges + recent finals)
    const d = new Date(now - i * 86400000);
    days.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`);
  }
  const out = [], seen = new Set();
  for (const day of days) {
    try {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${em.sp}/${em.lg}/scoreboard?dates=${day}`);
      if (!r.ok) continue;
      const data = await r.json();
      for (const e of (data.events || [])) {
        if (seen.has(e.id)) continue;
        seen.add(e.id);
        const comp = e.competitions && e.competitions[0];
        if (!comp) continue;
        const cs = comp.competitors || [];
        const home = cs.find(c => c.homeAway === "home");
        const away = cs.find(c => c.homeAway === "away");
        if (!home || !away) continue;
        const st = (e.status && e.status.type) || {};
        const hn = (home.team && (home.team.displayName || home.team.name)) || "";
        const an = (away.team && (away.team.displayName || away.team.name)) || "";
        out.push({
          home_team: hn,
          away_team: an,
          completed: !!st.completed,
          voided: /CANCEL|POSTPON/i.test(st.name || st.description || ""),
          inProgress: st.state === "in",
          date: e.date || null,
          id: e.id || null,
          scores: [{ name: hn, score: home.score }, { name: an, score: away.score }],
          homeLines: (home.linescores || []).map(l => Number((l && (l.value != null ? l.value : l.displayValue)) || 0)),
          awayLines: (away.linescores || []).map(l => Number((l && (l.value != null ? l.value : l.displayValue)) || 0)),
        });
      }
    } catch (e) { /* skip this day */ }
  }
  return out;
}

// ── ESPN box-score helpers (for player props) ────────────────────────────────
const ESPN_MAP = {
  nfl: { sp: "football",   lg: "nfl" },
  nba: { sp: "basketball", lg: "nba" },
  mlb: { sp: "baseball",   lg: "mlb" },
  ncaaf: { sp: "football", lg: "college-football" },
};

// Map the stat words in a prop pick_name to ESPN's stat labels/keys.
// (NBA verified against a real summary response. NFL/MLB are best-effort —
//  confirm with a sample box score before trusting those.)
const STAT_ALIASES = {
  // NBA
  "points": ["PTS", "points"], "pts": ["PTS", "points"],
  "rebounds": ["REB", "rebounds"], "reb": ["REB", "rebounds"], "boards": ["REB", "rebounds"],
  "assists": ["AST", "assists"], "ast": ["AST", "assists"], "dimes": ["AST", "assists"],
  "steals": ["STL", "steals"], "stl": ["STL", "steals"],
  "blocks": ["BLK", "blocks"], "blk": ["BLK", "blocks"],
  "turnovers": ["TO", "turnovers"],
  "3-pointers": ["3PT"], "three pointers": ["3PT"], "threes": ["3PT"], "3pt": ["3PT"], "3 pointers": ["3PT"],
  // Football (NFL + NCAAF). ESPN nests passing/rushing/receiving as separate
  // categories that SHARE labels (YDS/TD), so key off the category-specific ESPN
  // keys (passingYards, rushingYards, ...) and never the ambiguous shared labels.
  "passing yards": ["passingYards"], "pass yds": ["passingYards"], "pass yards": ["passingYards"],
  "rushing yards": ["rushingYards"], "rush yds": ["rushingYards"], "rush yards": ["rushingYards"],
  "receiving yards": ["receivingYards"], "rec yds": ["receivingYards"], "rec yards": ["receivingYards"],
  "receptions": ["receptions", "REC"], "catches": ["receptions", "REC"],
  "passing touchdowns": ["passingTouchdowns"], "passing tds": ["passingTouchdowns"], "pass tds": ["passingTouchdowns"],
  "rushing touchdowns": ["rushingTouchdowns"], "rushing tds": ["rushingTouchdowns"], "rush tds": ["rushingTouchdowns"],
  "receiving touchdowns": ["receivingTouchdowns"], "receiving tds": ["receivingTouchdowns"], "rec tds": ["receivingTouchdowns"],
  // MLB (verified against a real box score). Batting & pitching share labels
  // (H, R, HR, BB, K); with the universal DH each player is in only one group,
  // so a player's own stat resolves correctly (exception: two-way players).
  "strikeouts": ["K", "strikeouts", "strikeOuts"], "hits allowed": ["H", "hits"], "hits": ["H", "hits"],
  "earned runs": ["ER", "earnedRuns"], "runs allowed": ["R", "runs"], "runs": ["R", "runs"],
  "walks": ["BB", "walks", "baseOnBalls"], "home runs": ["HR", "homeRuns"], "homers": ["HR", "homeRuns"],
  "rbis": ["RBI", "RBIs", "rbi"], "rbi": ["RBI", "RBIs", "rbi"],
  "doubles": ["2B", "doubles"], "triples": ["3B", "triples"],
  "stolen bases": ["SB", "stolenBases"], "stolen base": ["SB", "stolenBases"],
  "outs": ["outs"], "pitcher outs": ["outs"], "outs recorded": ["outs"],
};

function normName(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Parse "Over 2.5 Assists" | "Under 1.5 Assists" | "25+ Points" | "284.5+ Pass Yds"
function parseProp(pickName) {
  // The player may be embedded in the name (either word order) or supplied separately
  // via pick.game (longshot legs). Examples:
  //   "Dylan Harper Over 10.5 Points"        -> player before Over/Under
  //   "Over Karl-Anthony Towns 3.5 Assists"  -> player between Over/Under and the line
  //   "Over 65.5 Rec Yds"                    -> no player (comes from pick.game)
  //   "LeBron James 25+ Points" / "25+ Points"
  const s = (pickName || "").trim();
  let m;
  m = s.match(/^(.+?)\s+(over|under)\s+([\d.]+)\s+(.+)$/i);
  if (m) return { player: m[1].trim(), dir: m[2].toLowerCase(), line: parseFloat(m[3]), stat: m[4].trim().toLowerCase() };
  m = s.match(/^(over|under)\s+(.+?)\s+([\d.]+)\s+(.+)$/i);
  if (m) return { player: m[2].trim(), dir: m[1].toLowerCase(), line: parseFloat(m[3]), stat: m[4].trim().toLowerCase() };
  m = s.match(/^(over|under)\s+([\d.]+)\s+(.+)$/i);
  if (m) return { player: null, dir: m[1].toLowerCase(), line: parseFloat(m[2]), stat: m[3].trim().toLowerCase() };
  m = s.match(/^(.+?)\s+([\d.]+)\s*\+\s*(.+)$/);
  if (m) return { player: m[1].trim(), dir: "over_eq", line: parseFloat(m[2]), stat: m[3].trim().toLowerCase() };
  m = s.match(/^([\d.]+)\s*\+\s*(.+)$/);
  if (m) return { player: null, dir: "over_eq", line: parseFloat(m[1]), stat: m[2].trim().toLowerCase() };
  // "Saquon Barkley - Anytime TD" (props.js TD-scorer label: player, dash, market —
  // no direction and no line). Settles as over_eq 1 on the combined TD count.
  m = s.match(/^(.+?)\s*-\s*anytime\s+td(?:s|scorer)?\s*$/i);
  if (m) return { player: m[1].trim(), dir: "over_eq", line: 1, stat: "anytime td" };
  return null;
}

function resolveStatLabels(statText) {
  const t = (statText || "").toLowerCase();
  const entries = Object.entries(STAT_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [k, labels] of entries) if (t.includes(k)) return labels;
  return [];
}

// "3-6" → 3 (made), "17" → 17
function statNumber(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  const n = parseFloat(s.includes("-") ? s.split("-")[0] : s);
  return isNaN(n) ? null : n;
}

async function espnRecentEventIds(sp, lg) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < 4; i++) {                              // today + last 3 days (UTC)
    const d = new Date(now); d.setUTCDate(d.getUTCDate() - i);
    const day = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
    try {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/scoreboard?dates=${day}`);
      if (!r.ok) continue;
      const data = await r.json();
      // Keep each completed game's start time AND teams, so a prop can be graded
      // off ITS OWN game (matched by matchup), not the player's most recent game.
      (data.events || []).forEach(e => {
        if (!e.status?.type?.completed) return;
        const comp = e.competitions && e.competitions[0];
        const cs = (comp && comp.competitors) || [];
        const hm = cs.find(c => c.homeAway === "home"), aw = cs.find(c => c.homeAway === "away");
        out.push({
          id: e.id, date: e.date || null,
          home: (hm && hm.team && (hm.team.displayName || hm.team.name)) || "",
          away: (aw && aw.team && (aw.team.displayName || aw.team.name)) || "",
        });
      });
    } catch {}
  }
  const seen = new Set(), uniq = [];
  for (const e of out) { if (!seen.has(e.id)) { seen.add(e.id); uniq.push(e); } }
  return uniq;
}

// A StatsAPI schedule entry counts as a COMPLETED, PLAYED game only if it passes this.
// MLB marks POSTPONED games abstractGameState "Final" (proved 19 Jul 2026, gamePk 823523:
// abstract "Final" + detailed "Postponed" — and its box score carried BOTH posted lineups
// with 31-key all-zero batting lines, which graded every Over on the game as L). So:
// 1) the dead original slot of a rescheduled game always carries rescheduleDate — skip it;
// 2) skip Postponed/Cancelled/Suspended detailedStates outright;
// 3) only then apply the final/completed test.
function schedGameCompleted(g) {
  if (!g) return false;
  if (g.rescheduleDate || g.rescheduleGameDate) return false;   // original slot of a postponed game
  const det = g.status?.detailedState || "";
  if (/postpon|cancel|suspend/i.test(det)) return false;        // terminal but never played
  const st = g.status?.abstractGameState || det;
  return /final|completed|game over/i.test(st);
}

// MLB StatsAPI (statsapi.mlb.com) — free, no key. Unlike ESPN's free box score it carries
// doubles, triples, totalBases and stolenBases, so derived props (e.g. total bases) grade
// automatically. Same index shape as buildPlayerStatIndex: name -> [{date,home,away,stats}].
async function buildMlbStatsApiIndex() {
  const index = {};
  const now = new Date();
  const games = [];
  const seenPk = new Set();
  for (let i = 0; i < 4; i++) {                               // today + last 3 days (UTC)
    const d = new Date(now); d.setUTCDate(d.getUTCDate() - i);
    const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    try {
      const r = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${day}`);
      if (!r.ok) continue;
      const data = await r.json();
      for (const dt of (data.dates || [])) {
        for (const g of (dt.games || [])) {
          if (!schedGameCompleted(g)) continue;  // only PLAYED completed games — see schedGameCompleted
          if (seenPk.has(g.gamePk)) continue;
          seenPk.add(g.gamePk);
          games.push({ pk: g.gamePk, date: g.gameDate || null, home: g.teams?.home?.team?.name || "", away: g.teams?.away?.team?.name || "" });
        }
      }
    } catch {}
  }
  const capped = games.slice(0, 48);                          // cap for runtime
  for (let i = 0; i < capped.length; i += 6) {
    const batch = capped.slice(i, i + 6);
    const results = await Promise.all(batch.map(async gm => {
      try {
        const r = await fetch(`https://statsapi.mlb.com/api/v1/game/${gm.pk}/boxscore`);
        if (!r.ok) return null;
        return { gm, box: await r.json() };
      } catch { return null; }
    }));
    for (const rr of results) {
      if (!rr || !rr.box) continue;
      const evDate = rr.gm.date ? Date.parse(rr.gm.date) : NaN;
      for (const side of ["home", "away"]) {
        const players = rr.box.teams?.[side]?.players || {};
        for (const key in players) {
          const pl = players[key];
          const nm = normName(pl.person?.fullName);
          if (!nm) continue;
          const bat = pl.stats?.batting || {};
          const pit = pl.stats?.pitching || {};
          // Merge batting then pitching (universal DH: a player is in one group, so shared
          // keys like strikeOuts resolve to that player's own stat).
          const stats = {};
          for (const k in bat) if (bat[k] != null) stats[k] = bat[k];
          for (const k in pit) if (pit[k] != null && stats[k] == null) stats[k] = pit[k];
          if (Object.keys(stats).length === 0) continue;       // didn't appear
          (index[nm] || (index[nm] = [])).push({ date: evDate, home: rr.gm.home, away: rr.gm.away, stats });
        }
      }
    }
  }
  return index;
}

// Build { normalizedPlayerName: { "AST": "3", "assists": "3", ... } } from completed box scores.
async function buildPlayerStatIndex(sp, lg) {
  const evs = (await espnRecentEventIds(sp, lg)).slice(0, 30); // cap for runtime
  const index = {};
  // Fetch summaries in small parallel batches to stay under the function timeout.
  for (let i = 0; i < evs.length; i += 6) {
    const batch = evs.slice(i, i + 6);
    const results = await Promise.all(batch.map(async ev => {
      try {
        const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/summary?event=${ev.id}`);
        if (!r.ok) return null;
        return { date: ev.date, home: ev.home, away: ev.away, players: (await r.json()).boxscore?.players || null };
      } catch { return null; }
    }));
    for (const rr of results) {
      if (!rr || !rr.players) continue;
      const evDate = rr.date ? Date.parse(rr.date) : NaN;
      const perGame = {}; // player -> merged stats for THIS game only
      for (const teamBlock of rr.players) {
        for (const grp of (teamBlock.statistics || [])) {
          const names = (grp.names || grp.labels || []);
          const keys = (grp.keys || []);
          for (const a of (grp.athletes || [])) {
            if (a.didNotPlay) continue;
            const nm = normName(a.athlete?.displayName);
            if (!nm) continue;
            const st = perGame[nm] || (perGame[nm] = {});
            (a.stats || []).forEach((val, idx) => {
              if (names[idx] != null && st[names[idx]] == null) st[names[idx]] = val;
              if (keys[idx] != null && st[keys[idx]] == null) st[keys[idx]] = val;
            });
          }
        }
      }
      // One entry PER GAME, tagged with that game's teams + date, so a prop can be
      // matched to its OWN game (by matchup) rather than the player's latest box score.
      for (const nm in perGame) {
        (index[nm] || (index[nm] = [])).push({ date: evDate, home: rr.home, away: rr.away, stats: perGame[nm] });
      }
    }
  }
  return index;
}

// Grade a single player prop against the box-score index.
// "Pittsburgh Pirates @ Philadelphia Phillies" -> ["Pittsburgh Pirates","Philadelphia Phillies"]
function parseMatchupTeams(g) {
  const s = (g || "").trim();
  if (!s.includes("@")) return null;
  const parts = s.split("@").map(x => x.trim()).filter(Boolean);
  return parts.length === 2 ? parts : null;
}
// Is `teamName` one of the two teams in a box-score entry? (full name OR nickname)
function teamInGame(teamName, entry) {
  const t = normName(teamName); if (!t) return false;
  const last = t.split(" ").pop();
  const hit = (x) => { x = normName(x || ""); return !!x && (x.includes(t) || t.includes(x) || x.split(" ").pop() === last); };
  return hit(entry.home) || hit(entry.away);
}

function gradeProp(pickName, gameField, index, info = {}, gameDate = null) {
  const parsed = parseProp(pickName);
  if (!parsed) { info.reason = "prop_unparsed"; return null; }
  // Standard props: player is in the pick_name and gameField is the matchup.
  // Longshot legs: no player in the name and gameField IS the player.
  const teams = parseMatchupTeams(gameField);
  const playerName = parsed.player || (teams ? null : gameField);
  const pl = normName(playerName);
  if (!pl || !index) { info.reason = "prop_no_player_name"; return null; }

  let entries = index[pl];
  if (!entries) {                                          // fallback: last name + first initial
    const parts = pl.split(" ");
    const last = parts[parts.length - 1];
    const fi = parts[0]?.[0];
    const hitKey = Object.keys(index).find(k => {
      const kp = k.split(" ");
      return kp[kp.length - 1] === last && (!fi || kp[0]?.[0] === fi);
    });
    if (hitKey) entries = index[hitKey];
  }
  if (!entries || !entries.length) {
    // Player absent from all fetched box scores. If a teammate from THIS matchup+date
    // is in the index the game is final and the player did not play -> void ("P").
    // Otherwise the game simply is not final yet -> pending.
    const _t = parseMatchupTeams(gameField);
    if (_t && _t.length === 2 && index) {
      const _w = gameDate ? Date.parse(gameDate) : NaN;
      let _final = false;
      for (const _nm in index) { for (const _e of index[_nm]) { if (teamInGame(_t[0], _e) && teamInGame(_t[1], _e) && (isNaN(_w) || (!isNaN(_e.date) && Math.abs(_e.date - _w) <= 2 * 3600 * 1000))) { _final = true; break; } } if (_final) break; }
      if (_final) { info.reason = "prop_player_dnp"; return "P"; }
    }
    info.reason = "prop_player_not_in_boxscores"; return null;
  }

  let stats = null;
  if (teams && teams.length === 2) {
    // Grade ONLY the box score for THIS prop's OWN game. A pick can only be made before
    // its game starts, so the matching completed box score must be that same game — never
    // a past meeting of the same teams. The box score's date must line up with the pick's
    // stored game_date (within 11h: covers doubleheaders + minor source time skew; a
    // same-matchup game on an adjacent day is 15h+ away and is correctly excluded).
    const cands = entries.filter(e => teamInGame(teams[0], e) && teamInGame(teams[1], e));
    if (!cands.length) { info.reason = "prop_game_not_final"; return null; }
    const want = gameDate ? Date.parse(gameDate) : NaN;
    if (!isNaN(want)) {
      // 2h, NOT 11h: the finals-only index makes a DH sibling the sole candidate
      // until the pick's own game finishes (19 Jul 2026, Chisholm G2-vs-G1 incident).
      const sameGame = cands.filter(e => !isNaN(e.date) && Math.abs(e.date - want) <= 2 * 3600 * 1000);
      if (!sameGame.length) { info.reason = "prop_game_not_final"; return null; }   // its game isn't final yet
      sameGame.sort((a, b) => Math.abs(a.date - want) - Math.abs(b.date - want));
      stats = sameGame[0].stats;
    } else {
      // Legacy pick with no stored game_date: only safe when there's a single completed
      // meeting of these teams (no multi-day series to confuse it); otherwise wait.
      const dated = cands.filter(e => !isNaN(e.date));
      if (dated.length !== 1) { info.reason = "prop_game_ambiguous_no_date"; return null; }
      stats = dated[0].stats;
    }
  } else {
    // No matchup teams available (e.g. longshot leg). Bind by game_date if present,
    // else fall back to the player's most recent completed game.
    const want = gameDate ? Date.parse(gameDate) : NaN;
    if (!isNaN(want)) {
      let best = null;
      for (const e of entries) { if (isNaN(e.date)) continue; const diff = Math.abs(e.date - want); if (best === null || diff < best.diff) best = { e, diff }; }
      if (!best || best.diff > 2 * 3600 * 1000) { info.reason = "prop_game_not_final"; return null; }  // 2h: DH-sibling safe
      stats = best.e.stats;
    } else {
      let latest = null;
      for (const e of entries) { if (isNaN(e.date)) continue; if (latest === null || e.date > latest.date) latest = e; }
      stats = (latest || entries[entries.length - 1]).stats;
    }
  }
  if (!stats) { info.reason = "prop_player_not_in_boxscores"; return null; }

  const sget = (keys) => { for (const k of keys) { if (stats[k] != null) { const n = statNumber(stats[k]); if (n != null) return n; } } return null; };
  const shas = (keys) => keys.some(k => stats[k] != null);
  let val;
  if (parsed.stat === "anytime td") {
    const rush = sget(["rushingTouchdowns"]) || 0;
    const rec  = sget(["receivingTouchdowns"]) || 0;
    val = rush + rec;
  } else if (/total\s*bases?\b/.test(parsed.stat) || /^tb$/.test(parsed.stat.trim())) {
    // Total bases = 1B + 2B*2 + 3B*3 + HR*4 = H + 2B + 2*3B + 3*HR. ESPN's batting line
    // doesn't always carry doubles/triples; only grade when the components are actually
    // present (direct stat, OR both 2B and 3B keys so a missing value means zero).
    // Otherwise leave PENDING — never grade total bases off an incomplete box score.
    const direct = sget(["totalBases", "TB", "total bases", "total_bases"]);
    if (direct != null) { val = direct; }
    else {
      const H = sget(["H", "hits"]);
      if (H == null || !shas(["2B", "doubles", "2b"]) || !shas(["3B", "triples", "3b"])) { info.reason = "prop_total_bases_data_unavailable"; return null; }
      const D = sget(["2B", "doubles", "2b"]) || 0;
      const Tr = sget(["3B", "triples", "3b"]) || 0;
      const HR = sget(["HR", "homeRuns", "hr"]) || 0;
      val = H + D + 2 * Tr + 3 * HR;
    }
  } else if (/hits?\s*\+\s*runs?\s*\+\s*rbi/i.test(parsed.stat) || /\bhrr\b/i.test(parsed.stat)) {
    // Hits + Runs + RBIs: no single box-score field; sum the three components.
    // Must be caught before the generic path (else "hits" substring-matches and it
    // grades as hits only). Grade only with a complete batting line, else PENDING.
    const H = sget(["H", "hits"]), R = sget(["R", "runs"]), RBI = sget(["RBI", "RBIs", "rbi"]);
    if (H == null || R == null || RBI == null) { info.reason = "prop_hrr_data_unavailable"; return null; }
    val = H + R + RBI;
  } else if (/\bsingles?\b/i.test(parsed.stat)) {
    // Singles = H - 2B - 3B - HR. Grade only with a complete batting line, else PENDING.
    const H = sget(["H", "hits"]), D = sget(["2B", "doubles", "2b"]), Tr = sget(["3B", "triples", "3b"]), HR = sget(["HR", "homeRuns", "hr"]);
    if (H == null || D == null || Tr == null || HR == null) { info.reason = "prop_singles_data_unavailable"; return null; }
    val = H - D - Tr - HR;
  } else {
    const labels = resolveStatLabels(parsed.stat);
    let raw = null;
    for (const l of labels) { if (stats[l] != null) { raw = stats[l]; break; } }
    val = statNumber(raw);
  }
  if (val == null) { info.reason = "prop_stat_not_found"; return null; }

  if (parsed.dir === "over")    return val > parsed.line ? "W" : val < parsed.line ? "L" : "P";
  if (parsed.dir === "under")   return val < parsed.line ? "W" : val > parsed.line ? "L" : "P";
  if (parsed.dir === "over_eq") return val >= parsed.line ? "W" : "L";
  return null;
}

// ── Grade a single straight pick ─────────────────────────────────────────────
// ── Period markets (1st half, first-5 innings, YRFI/NRFI) ────────────────────
// Which linescore indices make up the period implied by an Odds API market key.
function periodIndices(mk) {
  if (/_h1$/.test(mk)) return [0, 1];
  if (/_h2$/.test(mk)) return [2, 3];
  let m = mk.match(/_q([1-4])$/); if (m) return [parseInt(m[1], 10) - 1];
  m = mk.match(/_p([1-3])$/); if (m) return [parseInt(m[1], 10) - 1];
  m = mk.match(/_1st_(\d+)_innings$/); if (m) { const n = parseInt(m[1], 10); return Array.from({ length: n }, (_, i) => i); }
  return null;
}
function teamMatchName(team, outcome) {
  const t = (team || "").toLowerCase().trim(), o = (outcome || "").toLowerCase().trim();
  if (!t || !o) return false;
  if (o.includes(t) || t.includes(o)) return true;
  const tw = t.split(" ");
  return o.includes(tw[tw.length - 1]);
}
// Grade a period pick from the linescores, using the structured fields stored at lock
// (market_key / outcome / outcome_point). Returns "W" | "L" | "P" | null (not gradable yet).
function gradePeriod(pick, game, info) {
  const mk = pick.market_key || "";
  const idxs = periodIndices(mk);
  if (!idxs) { info.reason = "period_unrecognized"; return null; }
  const hl = game.homeLines, al = game.awayLines;
  if (!Array.isArray(hl) || !Array.isArray(al) || !hl.length || !al.length) { info.reason = "no_linescores"; return null; }
  const need = Math.max(...idxs);
  if (need >= hl.length || need >= al.length) { info.reason = "period_incomplete"; return null; }
  const h = idxs.reduce((sum, i) => sum + (Number(hl[i]) || 0), 0);
  const a = idxs.reduce((sum, i) => sum + (Number(al[i]) || 0), 0);
  const pt = pick.outcome_point != null ? parseFloat(pick.outcome_point) : null;
  const oc = (pick.outcome || pick.pick_name || "").toLowerCase();

  if (mk.startsWith("totals")) {          // includes YRFI/NRFI (totals_1st_1_innings @ 0.5)
    if (pt == null) return null;
    const tot = h + a;
    if (oc.includes("over"))  return tot > pt ? "W" : tot < pt ? "L" : "P";
    if (oc.includes("under")) return tot < pt ? "W" : tot > pt ? "L" : "P";
    return null;
  }
  if (mk.startsWith("spreads")) {
    if (pt == null) return null;
    const isHome = teamMatchName(game.home_team, pick.outcome);
    const isAway = teamMatchName(game.away_team, pick.outcome);
    let ps, os;
    if (isHome) { ps = h; os = a; } else if (isAway) { ps = a; os = h; } else return null;
    let sp = pt;
    if (pick.power_up_id && pick.power_up_id.indexOf("enhance") === 0) { const ti = parseFloat(pick.pu_tier); if (!isNaN(ti)) sp += ti; }
    const ats = ps + sp;
    return ats > os ? "W" : ats < os ? "L" : "P";
  }
  if (mk.startsWith("h2h")) {
    const winner = h > a ? game.home_team : (a > h ? game.away_team : null);
    if (!winner) return "P";              // period tie → push
    return teamMatchName(winner, pick.outcome) ? "W" : "L";
  }
  info.reason = "period_basetype_unhandled";
  return null;
}

// Final (or in-progress) team score for a pick's own game, matched out of the ESPN
// scoreboard the same way gradePick does (both teams referenced, closest to game_date).
// Returns null for longshot legs (pick.game is a player name) or when scores aren't in
// the feed. Informational only: grading stays authoritative above.
function gameScoreFor(pick, games) {
  if (!Array.isArray(games) || !games.length) return null;
  const teams = parseMatchupTeams(pick.game || "");
  if (!teams || teams.length !== 2) return null;
  const lastWord = (x) => { const n = normName(x || ""); const parts = n.split(" "); return parts[parts.length - 1]; };
  const same = (a, b) => { const na = normName(a || ""), nb = normName(b || ""); if (!na || !nb) return false; return na.includes(nb) || nb.includes(na) || lastWord(a) === lastWord(b); };
  const both = (g) => (same(teams[0], g.home_team) || same(teams[0], g.away_team)) && (same(teams[1], g.home_team) || same(teams[1], g.away_team));
  const want = pick.game_date ? Date.parse(pick.game_date) : NaN;
  let game = null;
  if (!isNaN(want)) {
    let best = null;
    for (const g of games) { if (!both(g) || !g.date) continue; const diff = Math.abs(Date.parse(g.date) - want); if (best === null || diff < best.diff) best = { g, diff }; }
    if (best && best.diff <= 11 * 3600 * 1000) game = best.g;
  } else {
    game = games.find(g => both(g)) || null;
  }
  if (!game || !game.scores) return null;
  const hs = parseFloat(game.scores.find(s => s.name === game.home_team)?.score ?? -1);
  const as = parseFloat(game.scores.find(s => s.name === game.away_team)?.score ?? -1);
  if (!(hs >= 0) || !(as >= 0)) return null;
  return { home_score: hs, away_score: as, final_status: game.completed ? "final" : (game.inProgress ? "in_progress" : null) };
}

function gradePick(pick, games, playerIndex, info = {}) {
  const slot = pick.slot;
  let baseType = (slot||"").split("_")[0];
  // Solo freeform picks are saved as slot "free_N", and wildcard slots as "wildcard_N",
  // neither of which carries a bet type — recover the real type from market_key, or they
  // match no grading branch and never settle (wildcard picks used to need hand-grading).
  if (baseType === "free" || baseType === "wildcard") {
    if (parseProp(pick.pick_name)) {
      baseType = "prop";
    } else {
      const mk = pick.market_key || "";
      if (mk.startsWith("spreads")) baseType = "spread";
      else if (mk.startsWith("totals")) baseType = "ou";
      else if (mk.startsWith("h2h")) baseType = "ml";
      else {
        const nm = (pick.pick_name || "").trim();
        if (/^(over|under)\b/i.test(nm)) baseType = "ou";
        else if (/[+-]\d+(\.\d+)?$/.test(nm)) baseType = "spread";
        else baseType = "ml";
      }
    }
  }
  // market_key is written straight from the odds feed and records what the bet ACTUALLY
  // is; slot only records which seat it landed in. The builder has let a spread into an
  // ml seat 3 times (verified 2 Aug 2026), and a run line graded as a moneyline pays out
  // on a 1-run win it never covered. When a PLAIN market disagrees with the slot, the
  // feed wins.
  //   - period markets (…_1st_N_innings, _h1, _q2 …) are excluded: gradePeriod already
  //     owns them by market_key, above, and "totals_1st_1_innings" must never collapse
  //     into a full-game total.
  //   - prop and longshot_ are excluded: they have their own branches and legitimately
  //     hold any market.
  const _mk = (pick.market_key || "").trim();
  if (/^(h2h|spreads|totals)$/.test(_mk)
      && baseType !== "prop"
      && !String(slot || "").startsWith("longshot_")) {
    const want = _mk === "spreads" ? "spread" : _mk === "totals" ? "ou" : "ml";
    if (baseType !== want) {
      info.slotMismatch = `${baseType}->${want}`;
      baseType = want;
    }
  }
  const name = (pick.pick_name || "").trim();
  // The matchup ("Away @ Home") lives in pick.game. O/U pick_names have NO team
  // in them (e.g. "Over 217.5"), so we MUST use pick.game to find the game.
  const matchup = (pick.game || "").trim();
  const hay = `${name} ${matchup}`.toLowerCase();

  // ── Prop (player stat): graded from the ESPN box-score index, not team scores.
  //    pick.game holds the player name for props (e.g. "Mikal Bridges").
  if (baseType === "prop" || (slot?.startsWith("longshot_") && parseProp(name))) {
    // A postponed/cancelled game voids its props exactly like its team picks. pick.game
    // carries the "Away @ Home" matchup for prop slots AND player-prop longshot legs
    // (verified against live rows 19 Jul 2026), so find the pick's own game in the ESPN
    // feed FIRST and honor `voided` before any box-score index is consulted — the index
    // is the layer MLB's "Postponed = Final" status poisoned.
    const _mt = parseMatchupTeams(matchup);
    if (_mt && Array.isArray(games) && games.length) {
      const _want = pick.game_date ? Date.parse(pick.game_date) : NaN;
      let _best = null;
      for (const g of games) {
        if (!g || !g.date) continue;
        const _e = { home: g.home_team, away: g.away_team };
        if (!teamInGame(_mt[0], _e) || !teamInGame(_mt[1], _e)) continue;
        const _diff = isNaN(_want) ? 0 : Math.abs(Date.parse(g.date) - _want);
        if (_best === null || _diff < _best.diff) _best = { g, diff: _diff };
      }
      if (_best && (isNaN(_want) || _best.diff <= 11 * 3600 * 1000) && _best.g.voided) { info.reason = "game_cancelled"; return "P"; }
    }
    return gradeProp(name, pick.game, playerIndex || {}, info, pick.game_date);
  }

  // A team is "referenced" if its full name OR its nickname (last word) appears.
  // Handles both "New York Knicks @ San Antonio Spurs" and "Dolphins @ Bills".
  const teamRef = (team) => {
    const tn = (team || "").toLowerCase().trim();
    if (!tn) return false;
    if (hay.includes(tn)) return true;
    const words = tn.split(" ");
    return hay.includes(words[words.length - 1]);
  };

  // Find the matching game. Prefer games where BOTH teams are referenced
  // (true for ml/spread/ou because pick.game carries the full matchup).
  const bothTeams = (g) => teamRef(g.home_team) && teamRef(g.away_team);
  // A pick stores the start time of the SPECIFIC game it's for (pick.game_date).
  // In a series the same teams play multiple nights, so we grade against the game
  // closest to that time — never just the first final we find for those teams.
  const wantTime = pick.game_date ? Date.parse(pick.game_date) : NaN;
  let game = null;
  if (!isNaN(wantTime)) {
    let best = null;
    for (const g of games) {
      if (!bothTeams(g) || !g.date) continue;
      const diff = Math.abs(Date.parse(g.date) - wantTime);
      if (best === null || diff < best.diff) best = { g, diff };
    }
    // 11h, matching the prop path — NOT 24h. A same-day makeup of a postponed game can
    // start 16-23h after the original slot (19 Jul 2026: split DH at +16.4h and +23.2h),
    // which a 24h window would grade as the pick's own game. 11h still covers legitimate
    // doubleheader siblings and source time skew.
    if (!best || best.diff > 11 * 3600 * 1000) { info.reason = "intended_game_not_in_feed"; return null; }
    game = best.g;
    if (game.voided) { info.reason = "game_cancelled"; return "P"; }
    // The right game exists but hasn't finished — wait for it, don't grade a sibling.
    if (!game.completed && !game.inProgress) { info.reason = "game_not_started"; return null; }
  } else {
    // Legacy picks (no game_date): old team-only match.
    game = games.find(g => (g.completed || g.inProgress) && bothTeams(g));
    if (!game) game = games.find(g => (g.completed || g.inProgress) && (teamRef(g.home_team) || teamRef(g.away_team)));
  }

  if (!game) { info.reason = "game_not_found_or_not_live"; return null; }

  // Period markets grade off linescores (not the full-game score), using the keys
  // stored at lock. Dormant for every existing pick (none carry a period market_key).
  if (pick.market_key && /(_q[1-4]|_h[12]|_p[1-3]|_1st_\d+_innings)$/.test(pick.market_key)) {
    if (!game.completed) { info.reason = "period_game_in_progress"; return null; }
    return gradePeriod(pick, game, info);
  }

  if (!game.scores) { info.reason = "no_scores_on_game"; return null; }

  const homeScore = parseFloat(game.scores?.find(s => s.name === game.home_team)?.score ?? -1);
  const awayScore = parseFloat(game.scores?.find(s => s.name === game.away_team)?.score ?? -1);

  if (homeScore < 0 || awayScore < 0) { info.reason = "scores_unavailable"; return null; }

  const total = homeScore + awayScore;
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const winnerName = homeWon ? game.home_team : game.away_team;
  const loserName  = homeWon ? game.away_team : game.home_team;
  const margin     = Math.abs(homeScore - awayScore);

  // ── Live early-win: an Over that has already cleared its line wins NOW, before
  //    the game is final. Under / spread / ML / props all still require a final.
  if (baseType === "ou") {
    const om = name.match(/^over\s+([\d.]+)/i);
    if (om && total > parseFloat(om[1])) return "W";
  }
  if (!game.completed) { info.reason = "game_in_progress"; return null; }

  // ── Moneyline ──
  if (baseType === "ml" || slot === "longshot_ml") {
    const pickedTeamWords = name.toLowerCase().split(" ");
    const pickedHome = pickedTeamWords.some(w => w.length > 3 && winnerName.toLowerCase().includes(w));
    return pickedHome ? "W" : "L";
  }

  // ── Spread ──
  if (baseType === "spread") {
    // pick_name format: "Team Name +/-X.X"  e.g. "Los Angeles Rams -2.5"
    const spreadMatch = name.match(/([+-]?\d+\.?\d*)$/);
    if (!spreadMatch) return null;
    let spread = parseFloat(spreadMatch[1]);
    // Spread Enhancer power-up: move the line in the bettor's favor by the tier.
    if (pick.power_up_id && pick.power_up_id.indexOf("enhance") === 0) {
      const tier = parseFloat(pick.pu_tier);
      if (!isNaN(tier)) spread += tier;
    }
    const teamPart = name.replace(/[+-]?\d+\.?\d*$/, "").trim().toLowerCase();

    const pickedHome = game.home_team.toLowerCase().split(" ").some(w => w.length > 3 && teamPart.includes(w));
    const pickedAway = game.away_team.toLowerCase().split(" ").some(w => w.length > 3 && teamPart.includes(w));

    let pickedScore, oppScore;
    if (pickedHome)      { pickedScore = homeScore; oppScore = awayScore; }
    else if (pickedAway) { pickedScore = awayScore; oppScore = homeScore; }
    else return null;

    // ATS: picked team score + spread > opponent score
    const ats = pickedScore + spread;
    if (ats > oppScore)       return "W";
    if (ats < oppScore)       return "L";
    return "P"; // push — exact cover
  }

  // ── Over/Under ──
  if (baseType === "ou") {
    // pick_name format: "Over 44.5" or "Under 44.5"
    const ouMatch = name.match(/^(Over|Under)\s+([\d.]+)/i);
    if (!ouMatch) return null;
    const direction = ouMatch[1].toLowerCase();
    const line      = parseFloat(ouMatch[2]);

    if (direction === "over")  return total > line ? "W" : total < line ? "L" : "P";
    if (direction === "under") return total < line ? "W" : total > line ? "L" : "P";
    return null;
  }

  // ── Longshot legs (ML-style) ──
  if (slot?.startsWith("longshot_")) {
    // Try ML grading — pick_name is usually "Team Name ML" or "Team Name +400"
    const cleanName = name.replace(/\s+(ML|[+-]\d+)$/i, "").trim().toLowerCase();
    const pickedWinner = winnerName.toLowerCase().split(" ").some(w => w.length > 3 && cleanName.includes(w));
    // Only an L if the name actually references a team in this game. A prop-shaped name
    // that slipped into a longshot slot must not default to L — that is exactly how
    // "Brice Turang Over 0.5 Doubles" was graded a loss and needed a DB correction.
    const pickedLoser = loserName.toLowerCase().split(" ").some(w => w.length > 3 && cleanName.includes(w));
    if (!pickedWinner && !pickedLoser) { info.reason = "longshot_team_unrecognized"; return null; }
    return pickedWinner ? "W" : "L";
  }

  info.reason = "slot_not_handled";
  return null;
}

// ── Points calculator ─────────────────────────────────────────────────────────
function calcPoints(multiplier, impliedOdds) {
  const dec = impliedOdds > 0
    ? (impliedOdds / 100) + 1
    : (100 / Math.abs(impliedOdds)) + 1;
  return parseFloat((multiplier * (dec - 1) * 10).toFixed(1));
}

function calcParlayPoints(multiplier, legs) {
  const dec = legs.reduce((acc, leg) => {
    const d = leg.implied_odds > 0
      ? (leg.implied_odds / 100) + 1
      : (100 / Math.abs(leg.implied_odds || 110)) + 1;
    return acc * d;
  }, 1);
  return parseFloat((multiplier * (dec - 1) * 10).toFixed(1));
}

// ── Main handler ──────────────────────────────────────────────────────────────

// Grades PLOK's own recommendations (plok_calls) with the SAME settlement engine
// as user picks, so PLOK keeps an auditable, self-graded track record. Calls that
// can't be resolved yet (game not final, player prop without an index) stay pending.
async function gradePlokCalls() {
  try {
    const calls = await sbGet(`plok_calls?result=eq.pending&select=*`);
    if (!Array.isArray(calls) || !calls.length) return;
    const scoresBySport = {};
    for (const call of calls) {
      const sport = call.sport;
      if (!sport || !ESPN_MAP[sport]) continue;
      if (!scoresBySport[sport]) {
        try { scoresBySport[sport] = await fetchScoresESPN(sport); } catch (e) { scoresBySport[sport] = []; }
      }
      const games = scoresBySport[sport];
      const pseudo = { slot: call.bet_type || "ml", pick_name: call.selection || "", game: call.game || "", game_date: call.game_date || null };
      let res = null;
      try { res = gradePick(pseudo, games, {}, {}); } catch (e) { res = null; }
      if (res === "W" || res === "L") {
        await sbPatch(`plok_calls?id=eq.${call.id}`, { result: res });
      }
    }
  } catch (e) { /* never let PLOK grading break the run */ }
}

// Keep each non-solo matchup's stored points in sync with graded picks DURING a live week,
// so standings, the matchup list, My Matchup, and the schedule (which all read the stored
// user1_points/user2_points columns) match the live detail view. Does NOT decide winners —
// week finalization (advance.js for h2h, settleBracketRound for brackets) owns winner_id, and
// finalized matchups (winner_id set) are never overwritten.
async function updateMatchupPoints(league, week) {
  try {
    if (!league || !league.id || !week) return;
    if ((league.league_type || "h2h") === "solo") return;
    const ms = await sbGet(`matchups?league_id=eq.${league.id}&week=eq.${week}&winner_id=is.null&select=id,user1_id,user2_id,user1_points,user2_points`);
    if (!Array.isArray(ms) || ms.length === 0) return; // nothing live to sync
    const won = await sbGet(`picks?league_id=eq.${league.id}&week=eq.${week}&result=eq.W&select=user_id,points_earned`);
    const totals = {};
    for (const pk of (Array.isArray(won) ? won : [])) { if (pk.user_id) totals[pk.user_id] = (totals[pk.user_id] || 0) + (parseFloat(pk.points_earned) || 0); }
    for (const m of ms) {
      const p1 = parseFloat((totals[m.user1_id] || 0).toFixed(1));
      const p2 = parseFloat((totals[m.user2_id] || 0).toFixed(1));
      if (p1 !== Number(m.user1_points || 0) || p2 !== Number(m.user2_points || 0)) {
        await sbPatch(`matchups?id=eq.${m.id}`, { user1_points: p1, user2_points: p2 });
      }
    }
  } catch (e) { /* best-effort */ }
}

// ── Who is calling? ─────────────────────────────────────────────────────────
// Two legitimate callers: the cron (CRON_SECRET) and a league commissioner using the
// "force grade" button. Everyone else gets nothing. Commissioner status is read from
// the DB against a verified token — never from the request body, and never from the
// fact that a button was hidden in the UI.
async function authedUserId(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token || !SB_URL || !SB_ANON) return null;
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u.id : null;
  } catch { return null; }
}
async function isCommissionerOf(userId, leagueId) {
  if (!userId || !leagueId || !SB_URL || !SB_KEY) return false;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/leagues?id=eq.${leagueId}&select=commissioner_id`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!r.ok) return false;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] && rows[0].commissioner_id === userId;
  } catch { return false; }
}

export default async function handler(req, res) {
  // Auth check — allow GET from Vercel cron (Authorization header) or POST with secret
  try { PUSH_BASE = 'https://' + (req.headers.host || process.env.VERCEL_URL || ''); } catch (e) { PUSH_BASE = null; }
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const bodySecret = req.body?.secret;

  // EVERY method is checked, and it fails CLOSED. This used to gate GET only —
  // "for manual POST from app: just allow it (commissioner-only button in UI)" — so
  // `curl -X POST /api/grade` ran the grader for anyone and burned Odds credits.
  if (!cronSecret) return res.status(500).json({ error: "CRON_SECRET not set" });
  const _isCron = authHeader === `Bearer ${cronSecret}` || bodySecret === cronSecret;
  if (!_isCron) {
    // The force-grade button: must be a signed-in commissioner OF THIS LEAGUE.
    const _uid = await authedUserId(req);
    if (!_uid) return res.status(401).json({ error: "Unauthorized" });
    const _lg = req.body && req.body.leagueId;
    if (!_lg) return res.status(400).json({ error: "leagueId required" });
    if (!(await isCommissionerOf(_uid, _lg))) return res.status(403).json({ error: "Commissioner only" });
  }

  try {
    _notifPrefCache.clear(); // fresh prefs each run (warm containers reuse module scope)
    const results = { graded: 0, skipped: 0, errors: [], reasons: {}, samples: [], debug: { scoresCompleted: [], scoresTotal: 0, indexedPlayers: 0 } };
    const playerIndexCache = {}; // sport -> { player: stats } (shared across leagues in this run)
    const scoresCacheBySport = {}; // sport -> ESPN games (fetched once per run, fresh each invocation)

    // Scope: a manual trigger from the app sends { leagueId } and grades ONLY that
    // league. The cron job (no leagueId) grades every league.
    const onlyLeagueId = req.body?.leagueId;
    const leagues = onlyLeagueId
      ? await sbGet(`leagues?id=eq.${onlyLeagueId}&select=id,sport,sports,current_week,league_type,name`)
      : await sbGet("leagues?select=id,sport,sports,current_week,league_type,name&is_demo=eq.false&completed_at=is.null");
    if (!Array.isArray(leagues)) throw new Error("Failed to fetch leagues");

    for (const league of leagues) {
      // maybeRemindPicks() removed here: api/remind.js already owns pick reminders and
      // does it better (counts PARTIAL slips, not just empty ones; only fires in the
      // final 72h; collapses parlay legs; includes a day countdown). Both were live at
      // once, deduping through different stores — notifications.type='pick_reminder'
      // here vs the notif_reminders table there — so members were getting two
      // differently-worded nudges per week. Silent while it was bell-only; it would
      // have become two phone buzzes the moment push was wired in.

      // Multi-sport: a league carries sports[] (legacy .sport = first entry) and every
      // pick row now records its own sport at lock time. Resolution is per-pick, with
      // league.sport as the fallback for legacy rows, so a mixed NFL+MLB league grades
      // both sides instead of silently stranding the second sport forever.
      const _lgSports = (Array.isArray(league.sports) && league.sports.length ? league.sports : [league.sport]).filter((s) => ESPN_MAP[s]);
      if (!_lgSports.length) continue;
      const _spOf = (p) => (p && p.sport && ESPN_MAP[p.sport]) ? p.sport : (ESPN_MAP[league.sport] ? league.sport : _lgSports[0]);

      // Get all pending picks. Solo leagues are submit-driven and never advance
      // current_week (it stays 1), so grade EVERY pending week for solo — otherwise
      // weeks 2+ would never resolve.
      const _isSolo = (league.league_type || "") === "solo";
      const picks = await sbGet(
        _isSolo
          ? `picks?league_id=eq.${league.id}&result=eq.pending&select=*`
          // Leagues too: grade EVERY pending week, not just current_week. The week
          // rollover (Tue 13:00Z) was permanently orphaning any pick whose game
          // finished after advance — 22 Jul 2026: three Tue-night picks stranded
          // pending because the league was already on week 4 when they went final.
          : `picks?league_id=eq.${league.id}&result=eq.pending&select=*`
      );
      if (!Array.isArray(picks) || picks.length === 0) { if (!_isSolo) await updateMatchupPoints(league, league.current_week); continue; }

      // Fetch LIVE + recent scores from ESPN (free — does NOT touch the Odds API).
      // Cached per sport within this run so leagues sharing a sport don't refetch.
      // Fetched for EVERY sport this league's pending picks actually reference.
      const _needSports = [...new Set(picks.map((p) => _spOf(p)))];
      try {
        for (const _sp of _needSports) {
          if (!scoresCacheBySport[_sp]) {
            scoresCacheBySport[_sp] = await fetchScoresESPN(_sp);
          }
        }
      } catch (e) {
        results.errors.push(`${league.id}: scores fetch failed — ${e.message}`);
        continue;
      }
      const _gamesFor = (p) => scoresCacheBySport[_spOf(p)] || [];
      const _allGames = _needSports.flatMap((s) => scoresCacheBySport[s] || []);

      // Build the player box-score index per sport, only for sports whose pending
      // picks actually include props.
      const _needsProp = (p) =>
        (p.slot||"").split("_")[0] === "prop"
        || (p.slot?.startsWith("longshot_") && (!((p.game || "").includes("@")) || !!parseProp(p.pick_name)))
        || ((p.slot||"").split("_")[0] === "free" && parseProp(p.pick_name));
      const _propSports = [...new Set(picks.filter(_needsProp).map((p) => _spOf(p)))];
      for (const _sp of _propSports) {
        if (playerIndexCache[_sp] !== undefined) continue;
        const em = ESPN_MAP[_sp];
        let idx;
        if (_sp === "mlb") {
          try { idx = await buildMlbStatsApiIndex(); } catch (e) { idx = {}; }
          if (!idx || Object.keys(idx).length === 0) { idx = em ? await buildPlayerStatIndex(em.sp, em.lg) : {}; }  // StatsAPI down -> ESPN fallback
        } else {
          idx = em ? await buildPlayerStatIndex(em.sp, em.lg) : {};
        }
        playerIndexCache[_sp] = idx;
      }
      const _indexFor = (p) => playerIndexCache[_spOf(p)] || {};

      // ── Diagnostics: what did the data sources actually return? ──
      results.debug.scoresTotal += _allGames.length;
      const completedLabels = _allGames.filter(g => g.completed).map(g => `${g.away_team} @ ${g.home_team}`);
      results.debug.scoresCompleted = [...new Set([...results.debug.scoresCompleted, ...completedLabels])].slice(0, 25);
      results.debug.indexedPlayers = Math.max(results.debug.indexedPlayers, ..._propSports.map((s) => Object.keys(playerIndexCache[s] || {}).length), 0);
      const noteSkip = (pick, reason) => {
        results.reasons[reason] = (results.reasons[reason] || 0) + 1;
        if (results.samples.length < 14) results.samples.push({ slot: pick.slot, name: pick.pick_name, game: pick.game, reason });
      };

      // Group picks by user and multiplier for parlay handling
      const _gradedAtStart = results.graded;
      const byUserMult = {};
      picks.forEach(p => {
        const key = p.parlay_legs ? (`${p.user_id}__${p.week}__parlay__${p.id}`) : (`${p.user_id}__${p.week}__${p.multiplier}`);
        if (!byUserMult[key]) byUserMult[key] = [];
        byUserMult[key].push(p);
      });

      for (const [key, group] of Object.entries(byUserMult)) {
        const isParlay = group[0]?.slot?.startsWith("longshot_");

        if (isParlay) {
          // Grade each leg individually
          const legInfos = group.map(() => ({}));
          const legResults = group.map((p, i) => gradePick(p, _gamesFor(p), _indexFor(p), legInfos[i]));

          // A voided leg (postponed/cancelled game) settles as "P" RIGHT AWAY so the user
          // gets the REPLACE button while the week is still open. Because the group query
          // only pulls result=eq.pending, a settled P leg drops out of this parlay group on
          // the next run — the parlay then settles over the remaining legs, same semantics
          // the solo parlay path has always had. A same-slot replacement pick re-enters the
          // group naturally (same user/week/mult, pending). Previously a P leg made allWon
          // and anyLost both false and the parlay stalled as "skipped" forever.
          for (let i = 0; i < group.length; i++) {
            if (legResults[i] === "P") {
              await sbPatch(`picks?id=eq.${group[i].id}`, { result: "P", points_earned: 0, ...(gameScoreFor(group[i], _gamesFor(group[i])) || {}) });
              results.graded++;
            }
          }
          const liveIdx = [];
          for (let i = 0; i < group.length; i++) if (legResults[i] !== "P") liveIdx.push(i);
          if (!liveIdx.length) continue;                       // every leg voided

          // Only finalize if ALL remaining legs have a result (no nulls)
          if (liveIdx.some(i => legResults[i] === null)) {
            results.skipped += liveIdx.length;
            liveIdx.forEach(i => { if (legResults[i] === null) noteSkip(group[i], legInfos[i].reason || "unknown"); });
            continue;
          }

          const live = liveIdx.map(i => group[i]);
          const allWon  = liveIdx.every(i => legResults[i] === "W");
          const anyLost = liveIdx.some(i => legResults[i] === "L");

          if (allWon) {
            let totalPts = calcParlayPoints(live[0].multiplier, live);
            if (live[0].power_up_id === "double") totalPts *= 2;
            // First remaining leg gets the points, rest get 0
            for (let k = 0; k < live.length; k++) {
              await sbPatch(`picks?id=eq.${live[k].id}`, { result: "W", points_earned: k === 0 ? totalPts : 0, ...(gameScoreFor(live[k], _gamesFor(live[k])) || {}) });
            }
            await notifyPick(live[0], league, "W", totalPts, live.length);
            results.graded += live.length;
          } else if (live[0].power_up_id === "insurance" && liveIdx.filter(i => legResults[i] === "L").length === 1) {
            // Insurance: parlay missed by exactly ONE non-void leg -> score it as if that leg wasn't in it.
            const winning = liveIdx.filter(i => legResults[i] === "W").map(i => group[i]);
            const insuredPts = winning.length ? calcParlayPoints(live[0].multiplier, winning) : 0;
            let placed = false;
            for (const i of liveIdx) {
              const give = legResults[i] === "W" && !placed; if (give) placed = true;
              await sbPatch(`picks?id=eq.${group[i].id}`, { result: legResults[i], points_earned: give ? insuredPts : 0, ...(gameScoreFor(group[i], _gamesFor(group[i])) || {}) });
            }
            await notifyPick(live[0], league, "W", insuredPts, live.length);
            results.graded += live.length;
          } else if (anyLost) {
            for (const p of live) {
              await sbPatch(`picks?id=eq.${p.id}`, { result: "L", points_earned: 0, ...(gameScoreFor(p, _gamesFor(p)) || {}) });
            }
            await notifyPick(live[0], league, "L", 0, live.length);
            results.graded += live.length;
          } else {
            results.skipped += live.length; // still pending
          }

        } else {
          // Straight pick
          for (const pick of group) {
            // ── Solo parlay: one row holds every leg in parlay_legs. Grade each leg and AND them.
            if (pick.parlay_legs && Array.isArray(pick.parlay_legs) && pick.parlay_legs.length) {
              const _legs = pick.parlay_legs;
              const _leg = (l) => ({ user_id: pick.user_id, week: pick.week, multiplier: pick.multiplier, slot: (l.category || "ml") + "_0", pick_name: l.pick, game: l.game || "", game_date: l.gameTime || null, implied_odds: l.impliedOdds, event_id: l.eventId || null, market_key: l.marketKey || null, outcome: l.outcome || null, outcome_point: (l.point != null ? l.point : null), sel_key: l.selKey || null });
              const _res = _legs.map((l) => gradePick(_leg(l), _gamesFor(pick), _indexFor(pick), {}));
              if (_res.some((r) => r === null)) { results.skipped++; noteSkip(pick, "parlay_leg_pending"); continue; }
              const _kept = _legs.map((_, i) => i).filter((i) => _res[i] !== "P");   // drop voided/pushed legs
              let _pr, _oddsN = 0;
              if (_kept.length === 0) { _pr = "P"; }
              else if (_kept.some((i) => _res[i] === "L")) { _pr = "L"; }
              else { const _d = _kept.reduce((a, i) => a * (_legs[i].impliedOdds > 0 ? (_legs[i].impliedOdds / 100 + 1) : (100 / Math.abs(_legs[i].impliedOdds) + 1)), 1); _oddsN = _d >= 2 ? Math.round((_d - 1) * 100) : Math.round(-100 / (_d - 1)); _pr = "W"; }
              const _pts = _pr === "W" ? calcPoints(pick.multiplier, _oddsN) : 0;
              await sbPatch(`picks?id=eq.${pick.id}`, { result: _pr, points_earned: _pts });
              try { await notifyPick(pick, league, _pr, _pts, _legs.length); } catch (e) {}
              results.graded++;
              continue;
            }
            const info = {};
            const result = gradePick(pick, _gamesFor(pick), _indexFor(pick), info);
            if (result === null) { results.skipped++; noteSkip(pick, info.reason || "unknown"); continue; }

            let pts = result === "W" ? calcPoints(pick.multiplier, pick.implied_odds) : 0;
            if (result === "W" && pick.power_up_id === "double") pts *= 2;
            if (result === "W" && pick.power_up_id === "second") pts = parseFloat((pts * 0.5).toFixed(1));
            await sbPatch(`picks?id=eq.${pick.id}`, { result, points_earned: pts, ...(gameScoreFor(pick, _gamesFor(pick)) || {}) });
            await notifyPick(pick, league, result, pts, 1);
            results.graded++;
          }
        }
      }
      if (results.graded > _gradedAtStart) {
        await stashWeekRanks(league);
        try {
          const wk = league.current_week;
          const sp = await sbGet(`picks?league_id=eq.${league.id}&week=eq.${wk}&result=eq.pending&select=user_id`);
          const pend = new Set((Array.isArray(sp) ? sp : []).map(r => r.user_id));
          const ran = [...new Set(picks.map(p => p.user_id))];
          for (const uid of ran) { if (uid && !pend.has(uid)) await maybeNotifyRecap(uid, league, wk); }
          if (pend.size === 0) await maybeNotifyCommishShare(league, wk);
        } catch (e) { /* best-effort */ }
      }
      await updateMatchupPoints(league, league.current_week);
      await settleBracketRound(league, league.current_week);
    }

    await gradePlokCalls();

    return res.status(200).json({ ok: true, ...results });
  } catch (err) {
    console.error("Grade error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// Named exports exist ONLY for the fixtures test harness (grade_tests.mjs);
// the deployed entry point is still the default handler.
export { gradePick, gradeProp, parseMatchupTeams, teamInGame, schedGameCompleted };