export default async function handler(req, res) {
  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: "Missing sport parameter" });

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const now = new Date().toISOString().split(".")[0] + "Z";

  // Try multiple bookmakers in order of preference
  const bookmakerGroups = [
    "draftkings",
    "draftkings,fanduel,betmgm,williamhill_us",
  ];

  try {
    let games = [];

    for (const bookmakers of bookmakerGroups) {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&bookmakers=${bookmakers}&dateFormat=iso&oddsFormat=american&commenceTimeFrom=${now}`;
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      if (!Array.isArray(data)) continue;

      // Filter to games that have at least one bookmaker with odds
      const withOdds = data.filter(g => g.bookmakers?.length > 0);
      if (withOdds.length > 0) {
        games = withOdds;
        const remaining = response.headers.get("x-requests-remaining");
        const used = response.headers.get("x-requests-used");
        games.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ games, remaining, used });
      }
    }

    // No odds available from any bookmaker yet
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ games: [], remaining: null, used: null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch odds" });
  }
}