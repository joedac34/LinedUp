const SPORT_MAP = {
  americanfootball_nfl: { sport: "football",   league: "nfl" },
  basketball_nba:       { sport: "basketball", league: "nba" },
  baseball_mlb:         { sport: "baseball",   league: "mlb" },
};

// Season stat labels to surface per sport
const SEASON_STATS = {
  football: ["Points Per Game", "Total Yards Per Game", "Passing Yards Per Game",
             "Rushing Yards Per Game", "Points Allowed Per Game", "Sacks"],
  basketball: ["Points Per Game", "Rebounds Per Game", "Assists Per Game",
               "Field Goal %", "3-Point %", "Turnovers Per Game"],
  baseball: ["Batting Average", "Home Runs", "ERA", "WHIP",
             "Runs Per Game", "Strikeouts Per Game"],
};

async function fetchTeamSeasonStats(sp, league, teamId) {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sp}/${league}/teams/${teamId}?enable=stats`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    const stats = data.team?.record?.items?.[0]?.stats || [];
    const wantedLabels = SEASON_STATS[sp] || [];
    return stats
      .filter(s => wantedLabels.some(w => s.name?.toLowerCase().includes(w.toLowerCase()) ||
                                          s.displayName?.toLowerCase().includes(w.toLowerCase())))
      .slice(0, 6)
      .map(s => ({ label: s.displayName || s.name, value: s.displayValue }));
  } catch { return []; }
}

async function fetchTeamRoster(sp, league, teamId) {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sp}/${league}/teams/${teamId}/roster`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    // Return top players with position + jersey
    return (data.athletes || [])
      .flatMap(group => group.items || [])
      .slice(0, 8)
      .map(p => ({
        name: p.displayName || p.fullName,
        position: p.position?.abbreviation,
        jersey: p.jersey,
        photo: p.headshot?.href,
      }));
  } catch { return []; }
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

      // Fetch season stats for both teams in parallel
      const [seasonStats0, seasonStats1] = await Promise.all(
        teamIds.map(id => fetchTeamSeasonStats(sp, league, id))
      );

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
        seasonStats: ti === 0 ? (seasonStats0 || []) : (seasonStats1 || []),
      }));

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

      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      return res.status(200).json({ teams, statLeaders, teamRecords, injuries });
    }

    // Scoreboard — for ticker matching
    const r = await fetch(`${base}/scoreboard`);
    if (!r.ok) return res.status(502).json({ error: "ESPN scoreboard fetch failed" });
    const data = await r.json();

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
      };
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json({ games });
  } catch (err) {
    console.error("ESPN API error:", err);
    res.status(500).json({ error: "Failed to fetch ESPN data" });
  }
}