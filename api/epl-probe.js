/**
 * /api/epl-probe.js  —  ONE-OFF spike (delete after the NHL build ships)
 *
 * De-risks the SOCCER (EPL) build, same pattern as cfb-probe. Returns:
 *   1. oddsApi : icehockey_nhl game-line coverage + P1 markets + player-prop markets
 *                (EPL is IN SEASON — both halves of this probe work today)
 *   2. espn    : a COMPLETED 2025-26 NHL game's box-score stat field names, split
 *                skaters vs goalies — these keys are what STAT_ALIASES must map to
 *                before any NHL prop can ship (never ship an ungradeable pick)
 *   3. teamMap : the 32-team map  fullName -> { abbr, nick, logo }
 *
 * Run:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://app.picklockapp.com/api/nhl-probe
 *
 * No writes. Costs a couple of Odds API credits when events exist, zero when not.
 */

const ODDS_KEY = process.env.ODDS_API_KEY;
// ?league=ucl flips both halves to Champions League (soccer_uefa_champs_league / uefa.champions).
let SPORT = "soccer_epl";
let ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1";

async function j(url, opts) {
  const r = await fetch(url, opts);
  const t = await r.text();
  let body; try { body = JSON.parse(t); } catch (e) { body = t.slice(0, 300); }
  return { ok: r.ok, status: r.status, body };
}

// ── 1. Odds API: game lines, first-period markets, and player props ───────────
async function probeOdds() {
  const out = { key: !!ODDS_KEY };
  if (!ODDS_KEY) return { ...out, error: "ODDS_API_KEY missing" };
  try {
    const gl = await j(`https://api.the-odds-api.com/v4/sports/${SPORT}/odds?apiKey=${ODDS_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`);
    if (!gl.ok) return { ...out, gameLines: { status: gl.status, body: gl.body } };
    const games = Array.isArray(gl.body) ? gl.body : [];
    out.gameLines = {
      count: games.length,
      // The h2h outcome COUNT is the whole build question: 3 (Home/Draw/Away)
      // means every two-way assumption downstream needs the session-2 work.
      h2hOutcomes: games.length ? [...new Set(games.flatMap(g => (g.bookmakers||[]).flatMap(b => (b.markets||[]).filter(m => m.key === "h2h").map(m => (m.outcomes||[]).length))))] : [],
      h2hOutcomeNames: games.length ? [...new Set((((games[0].bookmakers||[])[0]||{}).markets||[]).filter(m => m.key === "h2h").flatMap(m => (m.outcomes||[]).map(o => o.name)))] : [],
      note: games.length ? undefined : "no EPL events returned — unexpected in-season, check the sport key",
      sample: games.slice(0, 3).map(g => ({
        away: g.away_team, home: g.home_team, commence: g.commence_time,
        books: (g.bookmakers || []).length,
        markets: [...new Set((g.bookmakers || []).flatMap(b => (b.markets || []).map(m => m.key)))],
      })),
    };
    if (games.length) {
      const ev = games[0].id;
      const tried = `${games[0].away_team} @ ${games[0].home_team}`;
      // P1 markets ship in v1, so probe them explicitly.
      const p1 = await j(`https://api.the-odds-api.com/v4/sports/${SPORT}/events/${ev}/odds?apiKey=${ODDS_KEY}&regions=us&markets=btts,h2h_h1,totals_h1,draw_no_bet,double_chance,team_totals,alternate_spreads,alternate_totals&oddsFormat=american`);
      // For every market that posts, capture 3 sample outcomes: grading needs the
      // OUTCOME NAME SHAPES (is double_chance "Leeds United or Draw"? does
      // team_totals carry the team in name or description? do alternates use
      // point like main lines?), not just the fact that the market exists.
      const _samples = {};
      if (p1.ok && p1.body && p1.body.bookmakers) {
        for (const b of p1.body.bookmakers) for (const m of (b.markets || [])) {
          if (!_samples[m.key]) _samples[m.key] = (m.outcomes || []).slice(0, 3).map(o => ({ name: o.name, description: o.description, point: o.point, price: o.price }));
        }
      }
      out.periodMarkets = (p1.ok && p1.body && p1.body.bookmakers)
        ? { eventTried: tried, marketsReturned: Object.keys(_samples), sampleOutcomes: _samples }
        : { eventTried: tried, note: "no P1 markets returned", status: p1.status };
      // The prop set Joe asked for: goalscorer, SOG, assists, points, goalie saves.
      // Props deferred to v2, but record what books post so the decision is evidence-based.
      const propMarkets = "player_goal_scorer_anytime,player_shots_on_goal";
      const pr = await j(`https://api.the-odds-api.com/v4/sports/${SPORT}/events/${ev}/odds?apiKey=${ODDS_KEY}&regions=us&markets=${propMarkets}&oddsFormat=american`);
      if (pr.ok && pr.body && pr.body.bookmakers) {
        const mkts = [...new Set(pr.body.bookmakers.flatMap(b => (b.markets || []).map(m => m.key)))];
        const first = pr.body.bookmakers.flatMap(b => b.markets || [])[0];
        out.props = {
          eventTried: tried,
          marketsReturned: mkts,
          sampleOutcomes: first ? (first.outcomes || []).slice(0, 3).map(o => ({ name: o.name, description: o.description, point: o.point, price: o.price })) : [],
        };
      } else {
        out.props = { eventTried: tried, note: "no props returned (typical until close to game time)", status: pr.status };
      }
    }
  } catch (e) { out.error = String(e && e.message || e); }
  return out;
}

// ── 2. ESPN: completed game box score -> stat field names (grading) ──────────
async function probeEspnBox() {
  // 2025-26 regular-season / playoff dates guaranteed to hold completed games.
  const dates = ["20260823", "20260822", "20260816"]; // 2026-27 EPL matchweeks already played
  try {
    let gameId = null, gameName = null, usedDate = null;
    for (const d of dates) {
      const sb = await j(`${ESPN}/scoreboard?dates=${d}&limit=50`);
      const ev = (sb.body && sb.body.events || []).find(e => e.status && e.status.type && e.status.type.completed);
      if (ev) { gameId = ev.id; gameName = ev.shortName || ev.name; usedDate = d; break; }
    }
    if (!gameId) return { error: "no completed NHL game found on sample dates" };
    const sum = await j(`${ESPN}/summary?event=${gameId}`);
    const players = (sum.body && sum.body.boxscore && sum.body.boxscore.players) || [];
    // Soccer box structure differs from US sports; capture whatever categories exist,
    // but the v1 need is only the FINAL SCORE + status shape for draw settlement.
    const categories = {};
    let sampleSkater = null, sampleGoalie = null;
    for (const teamBlk of players) {
      for (const cat of (teamBlk.statistics || [])) {
        if (!categories[cat.name]) {
          categories[cat.name] = { keys: cat.keys || [], labels: cat.labels || [], descriptions: cat.descriptions || [] };
        }
        const isGoalie = /keeper|goalie/i.test(cat.name || "");
        if (!sampleGoalie && isGoalie && (cat.athletes || []).length) {
          const a = cat.athletes[0];
          sampleGoalie = { category: cat.name, player: a.athlete && a.athlete.displayName, keys: cat.keys, stats: a.stats };
        }
        if (!sampleSkater && !isGoalie && (cat.athletes || []).length) {
          const a = cat.athletes[0];
          sampleSkater = { category: cat.name, player: a.athlete && a.athlete.displayName, keys: cat.keys, stats: a.stats };
        }
      }
    }
    // Linescores/score confirm draw settlement inputs: equal finals = draw, and
    // league play has no extra time so the final IS the 90-minute result.
    const comp = (sum.body && sum.body.header && sum.body.header.competitions || [])[0] || {};
    const ls = (comp.competitors || []).map(c => ({ team: c.team && c.team.abbreviation, linescores: (c.linescores || []).map(l => l.displayValue != null ? l.displayValue : l.value) }));
    return { usedDate, game: gameName, statCategories: categories, sampleSkater, sampleGoalie, linescores: ls };
  } catch (e) { return { error: String(e && e.message || e) }; }
}

// ── 3. ESPN teams -> 32-team map (name -> abbr/nick/logo) ────────────────────
async function probeTeams() {
  try {
    const r = await j(`${ESPN}/teams?limit=40`);
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
  if (req.query && req.query.league === "ucl") {
    SPORT = "soccer_uefa_champs_league";
    ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions";
  }
  res.setHeader("Cache-Control", "no-store");
  if (req.query && req.query.only === "teams") {
    const teamMap = await probeTeams();
    return res.status(200).json({ generatedAt: new Date().toISOString(), teamMap });
  }
  const [oddsApi, espn, teamMap] = await Promise.all([probeOdds(), probeEspnBox(), probeTeams()]);
  return res.status(200).json({ generatedAt: new Date().toISOString(), oddsApi, espn, teamMap });
}