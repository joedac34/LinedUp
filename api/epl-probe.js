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
async function probeEspnBox(dateOverride) {
  // 2025-26 regular-season / playoff dates guaranteed to hold completed games.
  // ?date=YYYYMMDD overrides. THE decisive test for props: rosters[].roster[].stats
  // exposes totalGoals/goalAssists/shotsOnTarget, but an August fixture cannot tell
  // us whether those are PER-MATCH or SEASON-TO-DATE - both read 1 appearance that
  // early. Point this at a LATE-season match: appearances:1 means per-match (props
  // ship), appearances:30+ means cumulative and every anytime-goal prop would cash
  // off season totals instead of that day's goals.
  const _dq = dateOverride ? String(dateOverride).replace(/[^0-9]/g, "").slice(0, 8) : "";
  const dates = _dq ? [_dq] : ["20260823", "20260822", "20260816"];
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
    // ── Are soccer player stats gradeable at all? ────────────────────────────
    // boxscore.players comes back EMPTY for soccer (confirmed 30 Aug 2026), which
    // is why goalscorer props are currently unshippable: every other sport grades
    // props out of that structure. ESPN serves soccer player data differently, so
    // probe the plausible homes before concluding it cannot be done:
    //   rosters[].roster[].stats      - per-player season/match stats
    //   keyEvents / scoringPlays      - goal events with the scorer named
    // A goal-scorer prop only needs "who scored", so scoring EVENTS are enough
    // even if per-player stat lines are not exposed.
    const _b = sum.body || {};
    const _rosters = Array.isArray(_b.rosters) ? _b.rosters : [];
    const _firstWithStats = (() => {
      for (const r of _rosters) for (const pl of (r.roster || [])) {
        if (pl && Array.isArray(pl.stats) && pl.stats.length) {
          return {
            team: (r.team && (r.team.abbreviation || r.team.displayName)) || null,
            player: (pl.athlete && pl.athlete.displayName) || null,
            position: (pl.position && pl.position.abbreviation) || null,
            statKeys: pl.stats.map((x) => x.name || x.abbreviation || x.shortDisplayName),
            statSample: pl.stats.slice(0, 12).map((x) => ({ k: x.name || x.abbreviation, v: x.value != null ? x.value : x.displayValue })),
          };
        }
      }
      return null;
    })();
    // The first player with stats is always a keeper, so his line tells us nothing
    // about totalGoals/shotsOnTarget - the exact fields an anytime-goalscorer prop
    // grades on. Capture an OUTFIELDER and, decisively, anyone who actually scored.
    const _pick = (test) => {
      for (const r of _rosters) for (const pl of (r.roster || [])) {
        if (!pl || !Array.isArray(pl.stats) || !pl.stats.length) continue;
        const get = (k) => { const f = pl.stats.find((x) => (x.name || x.abbreviation) === k); return f ? (f.value != null ? f.value : f.displayValue) : null; };
        if (!test(pl, get)) continue;
        return {
          team: (r.team && (r.team.abbreviation || r.team.displayName)) || null,
          player: (pl.athlete && pl.athlete.displayName) || null,
          position: (pl.position && pl.position.abbreviation) || null,
          starter: pl.starter != null ? pl.starter : null,
          totalGoals: get("totalGoals"), goalAssists: get("goalAssists"),
          totalShots: get("totalShots"), shotsOnTarget: get("shotsOnTarget"),
          appearances: get("appearances"), subIns: get("subIns"),
        };
      }
      return null;
    };
    const _outfielder = _pick((pl) => ((pl.position && pl.position.abbreviation) || "") !== "G");
    const _scorer = _pick((pl, get) => Number(get("totalGoals")) > 0);
    const _assister = _pick((pl, get) => Number(get("goalAssists")) > 0);

    const _events = Array.isArray(_b.keyEvents) ? _b.keyEvents : [];
    const _goalEvents = _events
      .filter((e) => /goal/i.test((e.type && (e.type.text || e.type.id)) || "") || e.scoringPlay)
      .slice(0, 6)
      .map((e) => ({
        typeText: e.type && e.type.text,
        scoringPlay: !!e.scoringPlay,
        clock: e.clock && e.clock.displayValue,
        athletes: (e.athletesInvolved || []).map((x) => x.displayName),
        team: e.team && (e.team.abbreviation || e.team.displayName),
      }));

    return {
      usedDate, game: gameName, statCategories: categories, sampleSkater, sampleGoalie, linescores: ls,
      // THE props question. If either of these has content, soccer props ship.
      playerStats: {
        rostersPresent: _rosters.length,
        rosterPlayerWithStats: _firstWithStats,
        keyEventsTotal: _events.length,
        outfielder: _outfielder,
        scorer: _scorer,          // non-null with totalGoals>=1 => anytime-goalscorer ships
        assister: _assister,
        goalEventsSample: _goalEvents,
        topLevelKeys: Object.keys(_b).slice(0, 25),
      },
    };
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
  const _dateOverride = (req.query && req.query.date) ? req.query.date : "";
  if (req.query && req.query.league === "ucl") {
    SPORT = "soccer_uefa_champs_league";
    ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions";
  }
  res.setHeader("Cache-Control", "no-store");
  if (req.query && req.query.only === "teams") {
    const teamMap = await probeTeams();
    return res.status(200).json({ generatedAt: new Date().toISOString(), teamMap });
  }
  const [oddsApi, espn, teamMap] = await Promise.all([probeOdds(), probeEspnBox(_dateOverride), probeTeams()]);
  return res.status(200).json({ generatedAt: new Date().toISOString(), oddsApi, espn, teamMap });
}