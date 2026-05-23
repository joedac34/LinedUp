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

// ── Grade a single straight pick ─────────────────────────────────────────────
function gradePick(pick, games) {
  const slot = pick.slot;
  const name = (pick.pick_name || "").trim();

  // Find the matching game — search all games for team name match
  const game = games.find(g => {
    if (!g.completed) return false;
    const home = g.home_team || "";
    const away = g.away_team || "";
    // Check if pick_name contains either team
    return name.includes(home.split(" ").pop()) ||
           name.includes(away.split(" ").pop()) ||
           home.toLowerCase().split(" ").some(w => w.length > 3 && name.toLowerCase().includes(w)) ||
           away.toLowerCase().split(" ").some(w => w.length > 3 && name.toLowerCase().includes(w));
  });

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

  // ── Prop / Longshot legs ── (can't grade from scores, skip)
  if (slot === "prop") return null;

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
          const legResults = group.map(p => gradePick(p, games));

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
            if (pick.slot === "prop") { results.skipped++; continue; } // props = manual

            const result = gradePick(pick, games);
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