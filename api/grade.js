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
};

// ── Supabase REST helpers ─────────────────────────────────────────────────────
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key

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
    const payload = ranked.map(([user_id, pts], idx) => ({ league_id: league.id, user_id, week, rank: idx + 1, points: parseFloat(pts.toFixed(1)) }));
    if (payload.length) await sbUpsert("weekly_ranks?on_conflict=league_id,user_id,week", payload);
  } catch (e) { /* never break grading */ }
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
    await sbPost("notifications", {
      user_id: userId, type: "week_recap",
      title: `Your Week ${week} recap is in`,
      body: `You went ${wins}-${losses} for ${pts >= 0 ? "+" : ""}${pts.toFixed(1)} pts — tap to see your week.`,
      data: { league_id: league.id, week, record: `${wins}-${losses}`, points: parseFloat(pts.toFixed(1)) },
      created_at: new Date().toISOString(),
    });
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
        await sbPatch(`leagues?id=eq.${league.id}`, { champion_id: championId });
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
  // NFL (best-effort)
  "passing yards": ["YDS", "passingYards"], "pass yds": ["YDS", "passingYards"], "pass yards": ["YDS", "passingYards"],
  "rushing yards": ["YDS", "rushingYards"], "rush yds": ["YDS", "rushingYards"], "rush yards": ["YDS", "rushingYards"],
  "receiving yards": ["YDS", "receivingYards"], "rec yds": ["YDS", "receivingYards"], "rec yards": ["YDS", "receivingYards"],
  "receptions": ["REC", "receptions"], "touchdowns": ["TD"], "tds": ["TD"],
  // MLB (verified against a real box score). Batting & pitching share labels
  // (H, R, HR, BB, K); with the universal DH each player is in only one group,
  // so a player's own stat resolves correctly (exception: two-way players).
  "strikeouts": ["K", "strikeouts"], "hits allowed": ["H", "hits"], "hits": ["H", "hits"],
  "earned runs": ["ER", "earnedRuns"], "runs allowed": ["R", "runs"], "runs": ["R", "runs"],
  "walks": ["BB", "walks"], "home runs": ["HR", "homeRuns"], "homers": ["HR", "homeRuns"],
  "rbis": ["RBI", "RBIs"], "rbi": ["RBI", "RBIs"],
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
      // Keep each completed game's start time so a prop can be graded off ITS game, not the player's latest.
      (data.events || []).forEach(e => { if (e.status?.type?.completed) out.push({ id: e.id, date: e.date || null }); });
    } catch {}
  }
  const seen = new Set(), uniq = [];
  for (const e of out) { if (!seen.has(e.id)) { seen.add(e.id); uniq.push(e); } }
  return uniq;
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
        return { date: ev.date, players: (await r.json()).boxscore?.players || null };
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
      // One entry PER GAME (with its date) so we can grade the prop's OWN game.
      for (const nm in perGame) {
        (index[nm] || (index[nm] = [])).push({ date: evDate, stats: perGame[nm] });
      }
    }
  }
  return index;
}

// Grade a single player prop against the box-score index.
function gradeProp(pickName, gameField, index, info = {}, gameDate = null) {
  const parsed = parseProp(pickName);
  if (!parsed) { info.reason = "prop_unparsed"; return null; }
  const playerName = parsed.player || gameField;   // player is in the pick_name, else in pick.game
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
  if (!entries || !entries.length) { info.reason = "prop_player_not_in_boxscores"; return null; }

  // Bind to the SPECIFIC game this prop was placed on, by start time. Without this,
  // a player who also played yesterday gets graded off yesterday's box score.
  const want = gameDate ? Date.parse(gameDate) : NaN;
  let stats = null;
  if (!isNaN(want)) {
    let best = null;
    for (const e of entries) {
      if (isNaN(e.date)) continue;
      const diff = Math.abs(e.date - want);
      if (best === null || diff < best.diff) best = { e, diff };
    }
    // The intended game isn't final yet (only OTHER nights are indexed) -> wait, don't grade a sibling.
    if (!best || best.diff > 14 * 3600 * 1000) { info.reason = "prop_game_not_final"; return null; }
    stats = best.e.stats;
  } else {
    // Legacy prop with no game_date: fall back to the most recent completed game.
    let latest = null;
    for (const e of entries) { if (isNaN(e.date)) continue; if (latest === null || e.date > latest.date) latest = e; }
    stats = (latest || entries[entries.length - 1]).stats;
  }
  if (!stats) { info.reason = "prop_player_not_in_boxscores"; return null; }

  const labels = resolveStatLabels(parsed.stat);
  let raw = null;
  for (const l of labels) { if (stats[l] != null) { raw = stats[l]; break; } }
  const val = statNumber(raw);
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

function gradePick(pick, games, playerIndex, info = {}) {
  const slot = pick.slot;
  let baseType = (slot||"").split("_")[0];
  // Solo freeform picks are saved as slot "free_N" with no bet type in the slot,
  // so recover the real type — otherwise they match no grading branch and never settle.
  if (baseType === "free") {
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
  const name = (pick.pick_name || "").trim();
  // The matchup ("Away @ Home") lives in pick.game. O/U pick_names have NO team
  // in them (e.g. "Over 217.5"), so we MUST use pick.game to find the game.
  const matchup = (pick.game || "").trim();
  const hay = `${name} ${matchup}`.toLowerCase();

  // ── Prop (player stat): graded from the ESPN box-score index, not team scores.
  //    pick.game holds the player name for props (e.g. "Mikal Bridges").
  if (baseType === "prop" || (slot?.startsWith("longshot_") && parseProp(name))) {
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
    if (!best || best.diff > 24 * 3600 * 1000) { info.reason = "intended_game_not_in_feed"; return null; }
    game = best.g;
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
// Reminds league members who have NOT locked a slip for the current week.
// Respects the notif_reminder ("Pick Reminders") toggle and dedupes per league+week
// so a member is nudged at most once per week. Solo leagues are skipped.
async function maybeRemindPicks(league) {
  try {
    if (!league || !league.id || !league.current_week) return;
    if (league.league_type === "solo") return;
    const week = league.current_week;
    const members = await sbGet(`league_members?league_id=eq.${league.id}&select=user_id`);
    if (!Array.isArray(members) || !members.length) return;
    const memberIds = members.map(m => m.user_id);
    const pickRows = await sbGet(`picks?league_id=eq.${league.id}&week=eq.${week}&select=user_id`);
    const hasPicks = new Set((Array.isArray(pickRows) ? pickRows : []).map(p => p.user_id));
    const need = memberIds.filter(id => !hasPicks.has(id));
    if (!need.length) return;
    // Preference (defaults on when the column is null)
    const prefRows = await sbGet(`users?id=in.(${need.join(",")})&select=id,notif_reminder`);
    const optOut = new Set((Array.isArray(prefRows) ? prefRows : []).filter(u => u.notif_reminder === false).map(u => u.id));
    // Already reminded for this exact league+week?
    const already = await sbGet(`notifications?type=eq.pick_reminder&user_id=in.(${need.join(",")})&select=user_id,data`);
    const reminded = new Set((Array.isArray(already) ? already : []).filter(n => n.data && n.data.league_id === league.id && n.data.week === week).map(n => n.user_id));
    for (const uid of need) {
      if (optOut.has(uid) || reminded.has(uid)) continue;
      await sbPost("notifications", {
        user_id: uid,
        type: "pick_reminder",
        title: `Lock your Week ${week} slip`,
        body: `You haven't locked your picks for ${league.name || "your league"} yet — don't get left behind.`,
        data: { league_id: league.id, week },
      });
    }
  } catch (e) { /* never let a reminder failure break grading */ }
}

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

export default async function handler(req, res) {
  // Auth check — allow GET from Vercel cron (Authorization header) or POST with secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const bodySecret = req.body?.secret;

  // For Vercel cron (GET): check Authorization header
  // For manual POST from app: just allow it (commissioner-only button in UI)
  if (req.method === "GET" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
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
      ? await sbGet(`leagues?id=eq.${onlyLeagueId}&select=id,sport,current_week,league_type,name`)
      : await sbGet("leagues?select=id,sport,current_week,league_type,name");
    if (!Array.isArray(leagues)) throw new Error("Failed to fetch leagues");

    for (const league of leagues) {
      await maybeRemindPicks(league);
      const espnMap = ESPN_MAP[league.sport];
      if (!espnMap) continue;

      // Get all pending picks. Solo leagues are submit-driven and never advance
      // current_week (it stays 1), so grade EVERY pending week for solo — otherwise
      // weeks 2+ would never resolve.
      const _isSolo = (league.league_type || "") === "solo";
      const picks = await sbGet(
        _isSolo
          ? `picks?league_id=eq.${league.id}&result=eq.pending&select=*`
          : `picks?league_id=eq.${league.id}&week=eq.${league.current_week}&result=eq.pending&select=*`
      );
      if (!Array.isArray(picks) || picks.length === 0) continue;

      // Fetch LIVE + recent scores from ESPN (free — does NOT touch the Odds API).
      // Cached per sport within this run so leagues sharing a sport don't refetch.
      let games;
      try {
        if (!scoresCacheBySport[league.sport]) {
          scoresCacheBySport[league.sport] = await fetchScoresESPN(league.sport);
        }
        games = scoresCacheBySport[league.sport];
      } catch (e) {
        results.errors.push(`${league.id}: scores fetch failed — ${e.message}`);
        continue;
      }

      // Build the player box-score index once per sport, only if props are pending.
      const needProps = picks.some(p =>
        (p.slot||"").split("_")[0] === "prop"
        || (p.slot?.startsWith("longshot_") && !((p.game || "").includes("@")))
        || ((p.slot||"").split("_")[0] === "free" && parseProp(p.pick_name))
      );
      let playerIndex = {};
      if (needProps) {
        const em = ESPN_MAP[league.sport];
        if (playerIndexCache[league.sport] === undefined) {
          playerIndexCache[league.sport] = em ? await buildPlayerStatIndex(em.sp, em.lg) : {};
        }
        playerIndex = playerIndexCache[league.sport];
      }

      // ── Diagnostics: what did the data sources actually return? ──
      results.debug.scoresTotal += games.length;
      const completedLabels = games.filter(g => g.completed).map(g => `${g.away_team} @ ${g.home_team}`);
      results.debug.scoresCompleted = [...new Set([...results.debug.scoresCompleted, ...completedLabels])].slice(0, 25);
      results.debug.indexedPlayers = Math.max(results.debug.indexedPlayers, Object.keys(playerIndex || {}).length);
      const noteSkip = (pick, reason) => {
        results.reasons[reason] = (results.reasons[reason] || 0) + 1;
        if (results.samples.length < 14) results.samples.push({ slot: pick.slot, name: pick.pick_name, game: pick.game, reason });
      };

      // Group picks by user and multiplier for parlay handling
      const _gradedAtStart = results.graded;
      const byUserMult = {};
      picks.forEach(p => {
        const key = `${p.user_id}__${p.week}__${p.multiplier}`;
        if (!byUserMult[key]) byUserMult[key] = [];
        byUserMult[key].push(p);
      });

      for (const [key, group] of Object.entries(byUserMult)) {
        const isParlay = group[0]?.slot?.startsWith("longshot_");

        if (isParlay) {
          // Grade each leg individually
          const legInfos = group.map(() => ({}));
          const legResults = group.map((p, i) => gradePick(p, games, playerIndex, legInfos[i]));

          // Only finalize if ALL legs have a result (no nulls)
          if (legResults.some(r => r === null)) {
            results.skipped += group.length;
            group.forEach((p, i) => { if (legResults[i] === null) noteSkip(p, legInfos[i].reason || "unknown"); });
            continue;
          }

          const allWon  = legResults.every(r => r === "W");
          const anyLost = legResults.some(r => r === "L");

          if (allWon) {
            let totalPts = calcParlayPoints(group[0].multiplier, group);
            if (group[0].power_up_id === "double") totalPts *= 2;
            // First leg gets the points, rest get 0
            for (let i = 0; i < group.length; i++) {
              await sbPatch(`picks?id=eq.${group[i].id}`, {
                result: "W",
                points_earned: i === 0 ? totalPts : 0,
              });
            }
            await notifyPick(group[0], league, "W", totalPts, group.length);
            results.graded += group.length;
          } else if (group[0].power_up_id === "insurance" && legResults.filter(r => r === "L").length === 1) {
            // Insurance: parlay missed by exactly ONE leg -> score it as if that leg wasn't in it.
            const winning = group.filter((p, i) => legResults[i] === "W");
            const insuredPts = winning.length ? calcParlayPoints(group[0].multiplier, winning) : 0;
            let placed = false;
            for (let i = 0; i < group.length; i++) {
              const give = legResults[i] === "W" && !placed; if (give) placed = true;
              await sbPatch(`picks?id=eq.${group[i].id}`, { result: legResults[i], points_earned: give ? insuredPts : 0 });
            }
            await notifyPick(group[0], league, "W", insuredPts, group.length);
            results.graded += group.length;
          } else if (anyLost) {
            for (const p of group) {
              await sbPatch(`picks?id=eq.${p.id}`, { result: "L", points_earned: 0 });
            }
            await notifyPick(group[0], league, "L", 0, group.length);
            results.graded += group.length;
          } else {
            results.skipped += group.length; // still pending
          }

        } else {
          // Straight pick
          for (const pick of group) {
            const info = {};
            const result = gradePick(pick, games, playerIndex, info);
            if (result === null) { results.skipped++; noteSkip(pick, info.reason || "unknown"); continue; }

            let pts = result === "W" ? calcPoints(pick.multiplier, pick.implied_odds) : 0;
            if (result === "W" && pick.power_up_id === "double") pts *= 2;
            if (result === "W" && pick.power_up_id === "second") pts = parseFloat((pts * 0.5).toFixed(1));
            await sbPatch(`picks?id=eq.${pick.id}`, { result, points_earned: pts });
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
      await settleBracketRound(league, league.current_week);
    }

    await gradePlokCalls();

    return res.status(200).json({ ok: true, ...results });
  } catch (err) {
    console.error("Grade error:", err);
    return res.status(500).json({ error: err.message });
  }
}