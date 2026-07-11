/**
 * /api/cfb-probe.js  —  ONE-OFF spike (delete after running)
 *
 * De-risks the College Football build (Roadmap Step 0). Returns:
 *   1. oddsApi  : current NCAAF game-line + player-prop coverage (may be thin in offseason)
 *   2. espn     : a COMPLETED college-football box score's player-stat field names (for grading)
 *   3. teamMap  : generated ~FBS team map  fullName -> { abbr, nick, logo }  (for logos/abbr)
 *
 * Run (PowerShell):
 *   $h=@{ Authorization = "Bearer <CRON_SECRET>" }
 *   Invoke-RestMethod -Uri "https://lined-up-murex.vercel.app/api/cfb-probe" -Headers $h | ConvertTo-Json -Depth 8
 *
 * No writes. Uses ODDS_API_KEY. Costs a couple of Odds API credits (negligible).
 */

const ODDS_KEY = process.env.ODDS_API_KEY;
const SPORT = "americanfootball_ncaaf";
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

async function j(url, opts) {
  const r = await fetch(url, opts);
  const t = await r.text();
  let body; try { body = JSON.parse(t); } catch (e) { body = t.slice(0, 300); }
  return { ok: r.ok, status: r.status, body };
}

// ── 1. Odds API: game lines + one event's props ──────────────────────────────
async function probeOdds() {
  const out = { key: !!ODDS_KEY };
  if (!ODDS_KEY) return { ...out, error: "ODDS_API_KEY missing" };
  try {
    const gl = await j(`https://api.the-odds-api.com/v4/sports/${SPORT}/odds?apiKey=${ODDS_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`);
    if (!gl.ok) return { ...out, gameLines: { status: gl.status, body: gl.body } };
    const games = Array.isArray(gl.body) ? gl.body : [];
    out.gameLines = {
      count: games.length,
      sample: games.slice(0, 3).map(g => ({
        away: g.away_team, home: g.home_team, commence: g.commence_time,
        books: (g.bookmakers || []).length,
        markets: [...new Set((g.bookmakers || []).flatMap(b => (b.markets || []).map(m => m.key)))],
      })),
    };
    // props on the first event
    if (games.length) {
      const ev = games[0].id;
      const propMarkets = "player_pass_yds,player_pass_tds,player_rush_yds,player_reception_yds,player_anytime_td";
      const pr = await j(`https://api.the-odds-api.com/v4/sports/${SPORT}/events/${ev}/odds?apiKey=${ODDS_KEY}&regions=us&markets=${propMarkets}&oddsFormat=american`);
      if (pr.ok && pr.body && pr.body.bookmakers) {
        const mkts = [...new Set(pr.body.bookmakers.flatMap(b => (b.markets || []).map(m => m.key)))];
        const first = pr.body.bookmakers.flatMap(b => b.markets || [])[0];
        out.props = {
          eventTried: `${games[0].away_team} @ ${games[0].home_team}`,
          marketsReturned: mkts,
          sampleOutcomes: first ? (first.outcomes || []).slice(0, 3).map(o => ({ name: o.name, description: o.description, point: o.point, price: o.price })) : [],
        };
      } else {
        out.props = { eventTried: `${games[0].away_team} @ ${games[0].home_team}`, note: "no props returned (typical until in-season)", status: pr.status };
      }
    } else {
      out.props = { note: "no NCAAF events on the board right now (offseason) — re-run in-season to see props" };
    }
  } catch (e) { out.error = String(e && e.message || e); }
  return out;
}

// ── 2. ESPN: completed game box score -> stat field names (grading) ──────────
async function probeEspnBox() {
  // known in-season Saturdays to guarantee a completed game with full player stats
  const dates = ["20241130", "20241123", "20241116"];
  try {
    let gameId = null, gameName = null, usedDate = null;
    for (const d of dates) {
      const sb = await j(`${ESPN}/scoreboard?dates=${d}&groups=80&limit=100`);
      const ev = (sb.body && sb.body.events || []).find(e => e.status && e.status.type && e.status.type.completed);
      if (ev) { gameId = ev.id; gameName = ev.shortName || ev.name; usedDate = d; break; }
    }
    if (!gameId) return { error: "no completed CFB game found on sample dates" };
    const sum = await j(`${ESPN}/summary?event=${gameId}`);
    const players = (sum.body && sum.body.boxscore && sum.body.boxscore.players) || [];
    // extract each stat category's keys/labels + one sample athlete row
    const categories = {};
    let sampleAthlete = null;
    for (const teamBlk of players) {
      for (const cat of (teamBlk.statistics || [])) {
        if (!categories[cat.name]) {
          categories[cat.name] = { keys: cat.keys || [], labels: cat.labels || [], descriptions: cat.descriptions || [] };
        }
        if (!sampleAthlete && cat.name === "passing" && (cat.athletes || []).length) {
          const a = cat.athletes[0];
          sampleAthlete = { category: "passing", player: a.athlete && a.athlete.displayName, keys: cat.keys, stats: a.stats };
        }
      }
    }
    return { usedDate, game: gameName, statCategories: categories, samplePassing: sampleAthlete };
  } catch (e) { return { error: String(e && e.message || e) }; }
}

// ── 3. ESPN teams -> FBS map (name -> abbr/nick/logo) ────────────────────────
async function probeTeams() {
  try {
    const r = await j(`${ESPN}/teams?groups=80&limit=500`); // groups=80 = FBS only
    const teams = ((((r.body || {}).sports || [])[0] || {}).leagues || [])[0];
    const list = (teams && teams.teams) || [];
    const map = {};
    for (const t of list) {
      const tm = t.team || t;
      if (!tm.displayName) continue;
      map[tm.displayName] = {
        abbr: tm.abbreviation || "",
        nick: tm.name || "",
        logo: (tm.logos && tm.logos[0] && tm.logos[0].href) || "",
      };
    }
    return { count: Object.keys(map).length, map };
  } catch (e) { return { error: String(e && e.message || e) }; }
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.setHeader("Cache-Control", "no-store");
  if ((req.query && (req.query.only === "teams")) ) {
    const teamMap = await probeTeams();
    return res.status(200).json({ generatedAt: new Date().toISOString(), teamMap });
  }
  const [oddsApi, espn, teamMap] = await Promise.all([probeOdds(), probeEspnBox(), probeTeams()]);
  return res.status(200).json({ generatedAt: new Date().toISOString(), oddsApi, espn, teamMap });
}