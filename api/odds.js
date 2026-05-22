export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: "Missing sport parameter" });
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  // Format: YYYY-MM-DDTHH:MM:SSZ (no milliseconds)
  const now = new Date();
  const commenceFrom = now.toISOString().split(".")[0] + "Z";

  // Only show games within the next 7 days (this week's games only)
  const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const commenceTo = weekOut.toISOString().split(".")[0] + "Z";

  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&bookmakers=draftkings&dateFormat=iso&oddsFormat=american&commenceTimeFrom=${commenceFrom}&commenceTimeTo=${commenceTo}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const remaining = response.headers.get("x-requests-remaining");
    const used = response.headers.get("x-requests-used");
    res.status(200).json({ games: data, remaining, used });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch odds" });
  }
}