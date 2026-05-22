export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: "Missing sport parameter" });
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const now = new Date().toISOString().split(".")[0] + "Z";

  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&bookmakers=draftkings&dateFormat=iso&oddsFormat=american&commenceTimeFrom=${now}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const remaining = response.headers.get("x-requests-remaining");
    const used = response.headers.get("x-requests-used");

    // Deduplicate — only keep each team's NEXT game (earliest commence_time)
    // Sort by commence_time first
    if(Array.isArray(data)) {
      data.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
      
      // Find the earliest game date and only return games within 4 days of it
      // This effectively returns just the next round of games
      if(data.length > 0) {
        const earliestTime = new Date(data[0].commence_time);
        const cutoff = new Date(earliestTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        const filtered = data.filter(g => new Date(g.commence_time) <= cutoff);
        return res.status(200).json({ games: filtered, remaining, used });
      }
    }

    res.status(200).json({ games: data, remaining, used });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch odds" });
  }
}