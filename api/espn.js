const SPORT_MAP = {
  americanfootball_nfl: { sport: "football",    league: "nfl"  },
  basketball_nba:       { sport: "basketball",  league: "nba"  },
  baseball_mlb:         { sport: "baseball",    league: "mlb"  },
};

export default async function handler(req, res) {
  const { sport, gameId } = req.query;

  const mapping = SPORT_MAP[sport];
  if (!mapping) return res.status(400).json({ error: "Unsupported sport" });

  const { sport: sp, league } = mapping;
  const base = `https://site.api.espn.com/apis/site/v2/sports/${sp}/${league}`;

  try {
    if (gameId) {
      // Fetch full game summary (stats, leaders, etc.)
      const r = await fetch(`${base}/summary?event=${gameId}`);
      if (!r.ok) return res.status(502).json({ error: "ESPN summary fetch failed" });
      const data = await r.json();

      // Pull out what we need
      const boxscore = data.boxscore;
      const leaders  = data.leaders || [];
      const news     = data.news?.slice(0, 3) || [];
      const header   = data.header;
      const injuries = data.injuries || [];

      // Team stats from boxscore
      const teams = (boxscore?.teams || []).map(t => ({
        name:   t.team?.displayName,
        abbrev: t.team?.abbreviation,
        logo:   t.team?.logo,
        color:  t.team?.color ? `#${t.team.color}` : null,
        stats:  (t.statistics || []).slice(0, 6).map(s => ({
          label: s.label,
          value: s.displayValue,
        })),
      }));

      // Stat leaders (passing, rushing, receiving for NFL etc.)
      const statLeaders = leaders.map(cat => ({
        category: cat.name,
        leaders: (cat.leaders || []).slice(0, 2).map(l => ({
          name:   l.athlete?.displayName,
          team:   l.team?.abbreviation,
          photo:  l.athlete?.headshot?.href,
          stat:   l.displayValue,
        })),
      }));

      // Team records from header
      const competitors = header?.competitions?.[0]?.competitors || [];
      const teamRecords = competitors.map(c => ({
        name:   c.team?.displayName,
        abbrev: c.team?.abbreviation,
        logo:   c.team?.logo,
        color:  c.team?.color ? `#${c.team.color}` : null,
        record: c.records?.[0]?.summary || "",
        score:  c.score,
        homeAway: c.homeAway,
      }));

      res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate");
      return res.status(200).json({ teams, statLeaders, teamRecords, news });
    }

    // No gameId — return scoreboard to match ticker games to ESPN event IDs
    const r = await fetch(`${base}/scoreboard`);
    if (!r.ok) return res.status(502).json({ error: "ESPN scoreboard fetch failed" });
    const data = await r.json();

    const games = (data.events || []).map(e => {
      const comp = e.competitions?.[0];
      const away = comp?.competitors?.find(c => c.homeAway === "away");
      const home = comp?.competitors?.find(c => c.homeAway === "home");
      return {
        id:       e.id,
        name:     e.name,
        date:     e.date,
        status:   e.status?.type?.description,
        awayTeam: away?.team?.displayName,
        awayAbbr: away?.team?.abbreviation,
        awayLogo: away?.team?.logo,
        awayRecord: away?.records?.[0]?.summary || "",
        awayScore:  away?.score,
        homeTeam: home?.team?.displayName,
        homeAbbr: home?.team?.abbreviation,
        homeLogo: home?.team?.logo,
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