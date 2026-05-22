const PROP_MARKETS = {
  americanfootball_nfl: [
    "player_pass_yds",
    "player_pass_tds",
    "player_rush_yds",
    "player_receptions",
    "player_reception_yds",
    "player_rush_tds",
    "player_reception_tds",
  ],
  basketball_nba: [
    "player_points",
    "player_rebounds",
    "player_assists",
    "player_threes",
    "player_points_rebounds_assists",
  ],
  baseball_mlb: [
    "batter_hits",
    "batter_home_runs",
    "batter_rbis",
    "batter_runs_scored",
    "batter_stolen_bases",
    "batter_walks",
    "pitcher_strikeouts",
    "pitcher_hits_allowed",
    "pitcher_walks",
  ],
};

// Human-readable market labels
const MARKET_LABELS = {
  // NFL
  player_pass_yds:            "Pass Yds",
  player_pass_tds:            "Pass TDs",
  player_rush_yds:            "Rush Yds",
  player_receptions:          "Receptions",
  player_reception_yds:       "Rec Yds",
  player_rush_tds:            "Rush TDs",
  player_reception_tds:       "Rec TDs",
  // NBA
  player_points:              "Points",
  player_rebounds:            "Rebounds",
  player_assists:             "Assists",
  player_threes:              "3-Pointers",
  player_points_rebounds_assists: "Pts+Reb+Ast",
  // MLB
  batter_hits:                "Hits",
  batter_home_runs:           "Home Runs",
  batter_rbis:                "RBIs",
  batter_runs_scored:         "Runs Scored",
  batter_stolen_bases:        "Stolen Bases",
  batter_walks:               "Walks",
  pitcher_strikeouts:         "Strikeouts",
  pitcher_hits_allowed:       "Hits Allowed",
  pitcher_walks:              "Walks Allowed",
};

export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) return res.status(400).json({ error: "Missing sport parameter" });

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const markets = PROP_MARKETS[sport];
  if (!markets) return res.status(400).json({ error: "No prop markets for sport" });

  try {
    // Step 1: get upcoming events to extract event IDs
    const now = new Date().toISOString().split(".")[0] + "Z";
    const eventsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${apiKey}&dateFormat=iso&commenceTimeFrom=${now}`;
    const eventsRes = await fetch(eventsUrl);
    const events = await eventsRes.json();

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(200).json({ props: [] });
    }

    // Only fetch props for the next round of games (same 7-day window as odds route)
    events.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    const earliest = new Date(events[0].commence_time);
    const cutoff = new Date(earliest.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingEvents = events.filter(e => new Date(e.commence_time) <= cutoff);

    // Step 2: fetch props for each event (cap at 4 games to save API quota)
    const props = [];
    const marketsParam = markets.join(",");

    for (const event of upcomingEvents.slice(0, 4)) {
      const gameLabel = `${event.away_team} @ ${event.home_team}`;
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${event.id}/odds?apiKey=${apiKey}&regions=us&markets=${marketsParam}&bookmakers=draftkings&oddsFormat=american`;

      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();

        const dk = data.bookmakers?.[0];
        if (!dk) continue;

        dk.markets?.forEach(market => {
          const marketLabel = MARKET_LABELS[market.key] || market.key;
          market.outcomes?.forEach((outcome, oi) => {
            const american = outcome.price >= 0 ? `+${outcome.price}` : `${outcome.price}`;
            // outcome.description = "Over" | "Under", outcome.name = player name, outcome.point = line
            const direction = outcome.description || "";
            const line = outcome.point != null ? outcome.point : "";
            // e.g. "Trea Turner Over 1.5 Hits" or "Bryce Harper Under 0.5 Home Runs"
            const label = `${outcome.name} ${direction} ${line} ${marketLabel}`.replace(/\s+/g, " ").trim();

            props.push({
              id: `prop_${event.id}_${market.key}_${oi}`,
              game: gameLabel,
              pick: label,
              market: market.key,
              odds: american,
              impliedOdds: outcome.price,
            });
          });
        });
      } catch (e) {
        continue;
      }
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ props });
  } catch (err) {
    console.error("Props API error:", err);
    res.status(500).json({ error: "Failed to fetch props" });
  }
}