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
  const now = new Date().toISOString().split(".")[0] + "Z";
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&bookmakers=draftkings&dateFormat=iso&oddsFormat=american&commenceTimeFrom=${now}`;

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