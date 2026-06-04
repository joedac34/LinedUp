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

// ── Scores fetcher ────────────────────────────────────────────────────────────
async function fetchScores(sportKey) {
  const apiKey = process.env.ODDS_API_KEY;
  // daysFrom=3 gets games completed in last 3 days
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores?apiKey=${apiKey}&daysFrom=3&dateFormat=iso`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Scores API ${r.status}`);
  return r.json();
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
  const s = (pickName || "").trim();
  let m = s.match(/^(over|under)\s+([\d.]+)\s+(.+)$/i);
  if (m) return { dir: m[1].toLowerCase(), line: parseFloat(m[2]), stat: m[3].trim().toLowerCase() };
  m = s.match(/^([\d.]+)\s*\+\s*(.+)$/);                 // "25+ Points" → at least
  if (m) return { dir: "over_eq", line: parseFloat(m[1]), stat: m[2].trim().toLowerCase() };
  m = s.match(/^([\d.]+)\s*-\s*(.+)$/);                   // "25- Points" → under (rare)
  if (m) return { dir: "under", line: parseFloat(m[1]), stat: m[2].trim().toLowerCase() };
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
  const ids = [];
  const now = new Date();
  for (let i = 0; i < 4; i++) {                              // today + last 3 days (UTC)
    const d = new Date(now); d.setUTCDate(d.getUTCDate() - i);
    const day = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
    try {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/scoreboard?dates=${day}`);
      if (!r.ok) continue;
      const data = await r.json();
      (data.events || []).forEach(e => { if (e.status?.type?.completed) ids.push(e.id); });
    } catch {}
  }
  return [...new Set(ids)];
}

// Build { normalizedPlayerName: { "AST": "3", "assists": "3", ... } } from completed box scores.
async function buildPlayerStatIndex(sp, lg) {
  const ids = (await espnRecentEventIds(sp, lg)).slice(0, 30); // cap for runtime
  const index = {};
  // Fetch summaries in small parallel batches to stay under the function timeout.
  for (let i = 0; i < ids.length; i += 6) {
    const batch = ids.slice(i, i + 6);
    const results = await Promise.all(batch.map(async id => {
      try {
        const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/summary?event=${id}`);
        if (!r.ok) return null;
        return (await r.json()).boxscore?.players || null;
      } catch { return null; }
    }));
    for (const players of results) {
      if (!players) continue;
      for (const teamBlock of players) {
        for (const grp of (teamBlock.statistics || [])) {
          const names = (grp.names || grp.labels || []);
          const keys = (grp.keys || []);
          for (const a of (grp.athletes || [])) {
            if (a.didNotPlay) continue;
            const nm = normName(a.athlete?.displayName);
            if (!nm) continue;
            const entry = index[nm] || (index[nm] = {});
            (a.stats || []).forEach((val, idx) => {
              if (names[idx] != null && entry[names[idx]] == null) entry[names[idx]] = val;
              if (keys[idx] != null && entry[keys[idx]] == null) entry[keys[idx]] = val;
            });
          }
        }
      }
    }
  }
  return index;
}

// Grade a single player prop against the box-score index.
function gradeProp(pickName, playerName, index) {
  const parsed = parseProp(pickName);
  if (!parsed) return null;
  const pl = normName(playerName);
  if (!pl || !index) return null;

  let stats = index[pl];
  if (!stats) {                                             // fallback: last name + first initial
    const parts = pl.split(" ");
    const last = parts[parts.length - 1];
    const fi = parts[0]?.[0];
    const hitKey = Object.keys(index).find(k => {
      const kp = k.split(" ");
      return kp[kp.length - 1] === last && (!fi || kp[0]?.[0] === fi);
    });
    if (hitKey) stats = index[hitKey];
  }
  if (!stats) return null;                                  // player not found / DNP / game outside window

  const labels = resolveStatLabels(parsed.stat);
  let raw = null;
  for (const l of labels) { if (stats[l] != null) { raw = stats[l]; break; } }
  const val = statNumber(raw);
  if (val == null) return null;

  if (parsed.dir === "over")    return val > parsed.line ? "W" : val < parsed.line ? "L" : "P";
  if (parsed.dir === "under")   return val < parsed.line ? "W" : val > parsed.line ? "L" : "P";
  if (parsed.dir === "over_eq") return val >= parsed.line ? "W" : "L";
  return null;
}

// ── Grade a single straight pick ─────────────────────────────────────────────
function gradePick(pick, games, playerIndex) {
  const slot = pick.slot;
  const name = (pick.pick_name || "").trim();
  // The matchup ("Away @ Home") lives in pick.game. O/U pick_names have NO team
  // in them (e.g. "Over 217.5"), so we MUST use pick.game to find the game.
  const matchup = (pick.game || "").trim();
  const hay = `${name} ${matchup}`.toLowerCase();

  // ── Prop (player stat): graded from the ESPN box-score index, not team scores.
  //    pick.game holds the player name for props (e.g. "Mikal Bridges").
  const propParsed = parseProp(name);
  if (slot === "prop" || (slot?.startsWith("longshot_") && propParsed && !matchup.includes("@"))) {
    return gradeProp(name, pick.game, playerIndex || {});
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
  let game = games.find(g => g.completed && teamRef(g.home_team) && teamRef(g.away_team));
  // Fallback: single-team match (in case pick.game is missing on older picks).
  if (!game) game = games.find(g => g.completed && (teamRef(g.home_team) || teamRef(g.away_team)));

  if (!game || !game.scores) return null; // game not found or not completed

  const homeScore = parseFloat(game.scores?.find(s => s.name === game.home_team)?.score ?? -1);
  const awayScore = parseFloat(game.scores?.find(s => s.name === game.away_team)?.score ?? -1);

  if (homeScore < 0 || awayScore < 0) return null; // scores not available yet

  const total = homeScore + awayScore;
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const winnerName = homeWon ? game.home_team : game.away_team;
  const loserName  = homeWon ? game.away_team : game.home_team;
  const margin     = Math.abs(homeScore - awayScore);

  // ── Moneyline ──
  if (slot === "ml" || slot === "longshot_ml") {
    const pickedTeamWords = name.toLowerCase().split(" ");
    const pickedHome = pickedTeamWords.some(w => w.length > 3 && winnerName.toLowerCase().includes(w));
    return pickedHome ? "W" : "L";
  }

  // ── Spread ──
  if (slot === "spread") {
    // pick_name format: "Team Name +/-X.X"  e.g. "Los Angeles Rams -2.5"
    const spreadMatch = name.match(/([+-]?\d+\.?\d*)$/);
    if (!spreadMatch) return null;
    const spread = parseFloat(spreadMatch[1]);
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
  if (slot === "ou") {
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
    const results = { graded: 0, skipped: 0, errors: [] };
    const playerIndexCache = {}; // sport -> { player: stats } (shared across leagues in this run)

    // Get all active leagues
    const leagues = await sbGet("leagues?select=id,sport,current_week");
    if (!Array.isArray(leagues)) throw new Error("Failed to fetch leagues");

    for (const league of leagues) {
      const sportKey = SPORT_KEYS[league.sport];
      if (!sportKey) continue;

      // Get all pending picks for current week
      const picks = await sbGet(
        `picks?league_id=eq.${league.id}&week=eq.${league.current_week}&result=eq.pending&select=*`
      );
      if (!Array.isArray(picks) || picks.length === 0) continue;

      // Fetch scores for this sport
      let games;
      try {
        games = await fetchScores(sportKey);
      } catch (e) {
        results.errors.push(`${league.id}: scores fetch failed — ${e.message}`);
        continue;
      }

      // Build the player box-score index once per sport, only if props are pending.
      const needProps = picks.some(p =>
        p.slot === "prop" || (p.slot?.startsWith("longshot_") && !((p.game || "").includes("@")))
      );
      let playerIndex = {};
      if (needProps) {
        const em = ESPN_MAP[league.sport];
        if (playerIndexCache[league.sport] === undefined) {
          playerIndexCache[league.sport] = em ? await buildPlayerStatIndex(em.sp, em.lg) : {};
        }
        playerIndex = playerIndexCache[league.sport];
      }

      // Group picks by user and multiplier for parlay handling
      const byUserMult = {};
      picks.forEach(p => {
        const key = `${p.user_id}__${p.multiplier}`;
        if (!byUserMult[key]) byUserMult[key] = [];
        byUserMult[key].push(p);
      });

      for (const [key, group] of Object.entries(byUserMult)) {
        const isParlay = group[0]?.slot?.startsWith("longshot_");

        if (isParlay) {
          // Grade each leg individually
          const legResults = group.map(p => gradePick(p, games, playerIndex));

          // Only finalize if ALL legs have a result (no nulls)
          if (legResults.some(r => r === null)) {
            results.skipped += group.length;
            continue;
          }

          const allWon  = legResults.every(r => r === "W");
          const anyLost = legResults.some(r => r === "L");

          if (allWon) {
            const totalPts = calcParlayPoints(group[0].multiplier, group);
            // First leg gets the points, rest get 0
            for (let i = 0; i < group.length; i++) {
              await sbPatch(`picks?id=eq.${group[i].id}`, {
                result: "W",
                points_earned: i === 0 ? totalPts : 0,
              });
            }
            results.graded += group.length;
          } else if (anyLost) {
            for (const p of group) {
              await sbPatch(`picks?id=eq.${p.id}`, { result: "L", points_earned: 0 });
            }
            results.graded += group.length;
          } else {
            results.skipped += group.length; // still pending
          }

        } else {
          // Straight pick
          for (const pick of group) {
            const result = gradePick(pick, games, playerIndex);
            if (result === null) { results.skipped++; continue; }

            const pts = result === "W" ? calcPoints(pick.multiplier, pick.implied_odds) : 0;
            await sbPatch(`picks?id=eq.${pick.id}`, { result, points_earned: pts });
            results.graded++;
          }
        }
      }
    }

    return res.status(200).json({ ok: true, ...results });
  } catch (err) {
    console.error("Grade error:", err);
    return res.status(500).json({ error: err.message });
  }
}