const SPORT_MAP = {
  americanfootball_nfl: { sport: "football",   league: "nfl" },
  basketball_nba:       { sport: "basketball", league: "nba" },
  baseball_mlb:         { sport: "baseball",   league: "mlb" },
};

// Season "tape" stats, by ESPN standings stat name (present for every sport in
// team.record.items[0].stats). Batting/pitching splits (AVG/ERA) live on a
// different endpoint; these standings-derived stats are reliable cross-sport.
const TAPE_STATS = {
  football:   [["avgPointsFor", "Points / Game"], ["avgPointsAgainst", "Points Allowed"], ["winPercent", "Win %"]],
  basketball: [["avgPointsFor", "Points / Game"], ["avgPointsAgainst", "Points Allowed"], ["winPercent", "Win %"]],
  baseball:   [["avgPointsFor", "Runs / Game"],   ["avgPointsAgainst", "Runs Allowed"],   ["winPercent", "Win %"]],
};

// ESPN scores come back either as a plain number/string or as {value, displayValue}.
function scoreVal(s) {
  if (s == null) return null;
  if (typeof s === "object") {
    if (s.value != null) return Number(s.value);
    const n = parseFloat(s.displayValue);
    return isNaN(n) ? null : n;
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

async function fetchTeamMeta(sp, league, teamId) {
  const empty = { seasonStats: [], standing: "", record: "" };
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sp}/${league}/teams/${teamId}?enable=stats`;
    const r = await fetch(url);
    if (!r.ok) return empty;
    const data = await r.json();
    const team = data.team || {};
    const stats = team.record?.items?.[0]?.stats || [];
    const byName = {};
    stats.forEach(st => { if (st && st.name) byName[st.name] = st; });
    const seasonStats = (TAPE_STATS[sp] || []).map(([name, label]) => {
      const st = byName[name];
      if (!st) return null;
      let value = st.displayValue;
      if (name === "winPercent") {
        const f = parseFloat(st.value != null ? st.value : st.displayValue);
        if (!isNaN(f)) value = Math.round(f * 100) + "%";
      }
      return (value != null && value !== "") ? { label, value: String(value) } : null;
    }).filter(Boolean);
    return {
      seasonStats,
      standing: team.standingSummary || "",
      record: team.record?.items?.[0]?.summary || "",
    };
  } catch { return empty; }
}

// Last-5 form, last-10 record, and current streak for a team (most recent first).
// lastFiveGames isn't in the game summary, so we read the team's schedule and take
// its most recent completed games.
async function fetchTeamForm(sp, league, teamId) {
  const empty = { form: [], last10: "", streak: "" };
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sp}/${league}/teams/${teamId}/schedule`;
    const r = await fetch(url);
    if (!r.ok) return empty;
    const data = await r.json();
    const events = data.events || [];
    const completed = events.filter(e => {
      const comp = e.competitions?.[0];
      return comp?.status?.type?.completed === true;
    });
    completed.sort((a, b) => new Date(b.date) - new Date(a.date)); // most recent first
    const results = completed.map(e => {
      const comp = e.competitions[0];
      const cs = comp.competitors || [];
      const me = cs.find(c => String(c.team?.id) === String(teamId));
      const opp = cs.find(c => c !== me);
      const myScore = scoreVal(me?.score);
      const oppScore = scoreVal(opp?.score);
      let res = "";
      if (me?.winner === true) res = "W";
      else if (me?.winner === false) res = "L";
      else if (myScore != null && oppScore != null) res = myScore > oppScore ? "W" : (myScore < oppScore ? "L" : "T");
      return {
        r: res,
        opp: opp?.team?.abbreviation || "",
        home: me?.homeAway === "home",
        score: (myScore != null && oppScore != null) ? `${myScore}-${oppScore}` : "",
      };
    }).filter(g => g.r);
    const form = results.slice(0, 5);
    const l10 = results.slice(0, 10);
    const w = l10.filter(g => g.r === "W").length;
    const l = l10.filter(g => g.r === "L").length;
    const last10 = l10.length ? `${w}-${l}` : "";
    let streak = "";
    if (results.length) {
      const top = results[0].r;
      if (top === "W" || top === "L") {
        let n = 0;
        for (const g of results) { if (g.r === top) n++; else break; }
        streak = top + n;
      }
    }
    return { form, last10, streak };
  } catch { return empty; }
}

export default async function handler(req, res) {
  const { sport, gameId } = req.query;

  const mapping = SPORT_MAP[sport];
  if (!mapping) return res.status(400).json({ error: "Unsupported sport" });

  const { sport: sp, league } = mapping;
  const base = `https://site.api.espn.com/apis/site/v2/sports/${sp}/${league}`;

  try {
    if (gameId) {
      // Fetch game summary in parallel with team season stats
      const summaryRes = await fetch(`${base}/summary?event=${gameId}`);
      if (!summaryRes.ok) return res.status(502).json({ error: "ESPN summary fetch failed" });
      const data = await summaryRes.json();

      const boxscore    = data.boxscore;
      const leaders     = data.leaders || [];
      const header      = data.header;
      const injuryData  = data.injuries || [];

      // Team IDs for season stats fetch
      const competitors = header?.competitions?.[0]?.competitors || [];
      const teamIds = competitors.map(c => c.team?.id).filter(Boolean);

      // Fetch season stats AND last-5 form for both teams in parallel.
      // Both are kept in teamIds order and assigned by the same ti index below,
      // so a team's form always lines up with its own season stats.
      const [metaPairs, formPairs] = await Promise.all([
        Promise.all(teamIds.map(id => fetchTeamMeta(sp, league, id))),
        Promise.all(teamIds.map(id => fetchTeamForm(sp, league, id))),
      ]);
      // Align meta + form to boxscore teams by team id (ESPN's competitor order
      // can differ from the boxscore team order, which otherwise swaps the data).
      const metaById = {}, formById = {};
      teamIds.forEach((id, i) => { metaById[id] = metaPairs[i] || {}; formById[id] = formPairs[i] || { form: [], last10: "", streak: "" }; });
      const meta0 = metaPairs[0] || {}, meta1 = metaPairs[1] || {};
      const [form0, form1] = formPairs;

      // Game boxscore stats (in-game, pre-game will be empty)
      const teams = (boxscore?.teams || []).map((t, ti) => ({
        name:        t.team?.displayName,
        abbrev:      t.team?.abbreviation,
        logo:        t.team?.logo,
        color:       t.team?.color ? `#${t.team.color}` : null,
        gameStats:   (t.statistics || []).slice(0, 8).map(s => ({
          label: s.label,
          value: s.displayValue,
        })),
        seasonStats: (metaById[t.team?.id] || (ti === 0 ? meta0 : meta1)).seasonStats || [],
        standing:    (metaById[t.team?.id] || (ti === 0 ? meta0 : meta1)).standing || "",
        record:      (metaById[t.team?.id] || (ti === 0 ? meta0 : meta1)).record || "",
        form:        (formById[t.team?.id] || (ti === 0 ? form0 : form1) || {}).form || [],
        last10:      (formById[t.team?.id] || (ti === 0 ? form0 : form1) || {}).last10 || "",
        streak:      (formById[t.team?.id] || (ti === 0 ? form0 : form1) || {}).streak || "",
      }));

      // Head-to-head — current-season series (seasonseries is already in the summary).
      // Only completed prior meetings (those with scores) are surfaced.
      let h2h = [];
      let h2hSummary = "";
      const series = (data.seasonseries || [])[0];
      if (series) {
        h2hSummary = series.summary || "";
        h2h = (series.events || []).map(ev => {
          const cs = ev.competitors || ev.competitions?.[0]?.competitors || [];
          const away = cs.find(c => c.homeAway === "away");
          const home = cs.find(c => c.homeAway === "home");
          const d = ev.date ? new Date(ev.date) : null;
          const dateStr = (d && !isNaN(d.getTime()))
            ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "";
          return {
            date: dateStr,
            a: away?.team?.abbreviation || "",
            h: home?.team?.abbreviation || "",
            as: scoreVal(away?.score),
            hs: scoreVal(home?.score),
          };
        }).filter(m => m.as != null && m.hs != null);
      }

      // Stat leaders
      const statLeaders = leaders.map(cat => ({
        category: cat.name,
        leaders: (cat.leaders || []).slice(0, 3).map(l => ({
          name:  l.athlete?.displayName,
          team:  l.team?.abbreviation,
          photo: l.athlete?.headshot?.href,
          stat:  l.displayValue,
        })),
      }));

      // Team records
      const teamRecords = competitors.map(c => ({
        name:     c.team?.displayName,
        abbrev:   c.team?.abbreviation,
        logo:     c.team?.logo,
        color:    c.team?.color ? `#${c.team.color}` : null,
        record:   c.records?.[0]?.summary || "",
        score:    c.score,
        homeAway: c.homeAway,
        teamId:   c.team?.id,
      }));

      // Injuries — flatten and format
      const injuries = injuryData.flatMap(team =>
        (team.injuries || []).slice(0, 4).map(p => ({
          name:   p.athlete?.displayName,
          team:   team.team?.abbreviation,
          status: p.status,
          detail: p.details?.type || p.details?.fantasyStatus?.description || "",
          photo:  p.athlete?.headshot?.href,
        }))
      );

      // Venue, broadcast (TV) and weather for the matchup header.
      const venue = data.gameInfo?.venue?.fullName || header?.competitions?.[0]?.venue?.fullName || "";
      let broadcast = "";
      const bcasts = header?.competitions?.[0]?.broadcasts || data.broadcasts || [];
      if (bcasts.length) {
        const b0 = bcasts[0];
        broadcast = (b0.names && b0.names[0]) || b0.shortName || b0.media?.shortName || b0.market?.media?.shortName || "";
      }
      let weather = null;
      const w = data.gameInfo?.weather || data.weather;
      if (w && (w.temperature != null || w.displayValue)) {
        weather = {
          temp: w.temperature != null ? w.temperature : (w.highTemperature != null ? w.highTemperature : null),
          summary: w.displayValue || "",
        };
      }

      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      return res.status(200).json({ teams, statLeaders, teamRecords, injuries, h2h, h2hSummary, venue, broadcast, weather });
    }

    // Scoreboard — for ticker matching
    const r = await fetch(`${base}/scoreboard`);
    if (!r.ok) return res.status(502).json({ error: "ESPN scoreboard fetch failed" });
    const data = await r.json();

    const probOf = (c) => {
      const p = c?.probables?.[0];
      const a = p && p.athlete;
      if (!a) return null;
      const hs = a.headshot;
      return {
        name: a.displayName || a.shortName || "",
        record: p.record || "",
        pos: (typeof a.position === "string" ? a.position : (a.position && a.position.abbreviation)) || "",
        photo: (typeof hs === "string" ? hs : (hs && hs.href)) || "",
      };
    };
    const games = (data.events || []).map(e => {
      const comp = e.competitions?.[0];
      const away = comp?.competitors?.find(c => c.homeAway === "away");
      const home = comp?.competitors?.find(c => c.homeAway === "home");
      return {
        id:         e.id,
        name:       e.name,
        date:       e.date,
        status:     e.status?.type?.description,
        awayTeam:   away?.team?.displayName,
        awayAbbr:   away?.team?.abbreviation,
        awayLogo:   away?.team?.logo,
        awayRecord: away?.records?.[0]?.summary || "",
        awayScore:  away?.score,
        homeTeam:   home?.team?.displayName,
        homeAbbr:   home?.team?.abbreviation,
        homeLogo:   home?.team?.logo,
        homeRecord: home?.records?.[0]?.summary || "",
        homeScore:  home?.score,
        awayProbable: probOf(away),
        homeProbable: probOf(home),
      };
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json({ games });
  } catch (err) {
    console.error("ESPN API error:", err);
    res.status(500).json({ error: "Failed to fetch ESPN data" });
  }
}