const PROP_MARKETS = {
  americanfootball_nfl: [
    "player_anytime_td","player_first_td","player_pass_yds","player_pass_tds",
    "player_rush_yds","player_receptions","player_reception_yds","player_rush_tds","player_reception_tds",
  ],
  basketball_nba: [
    "player_points","player_rebounds","player_assists","player_threes","player_points_rebounds_assists",
  ],
  baseball_mlb: [
    "batter_home_runs","batter_hits","batter_total_bases","batter_rbis","pitcher_strikeouts",
    // batch 1 (all gradeable by grade.js STAT_ALIASES):
    "batter_runs_scored","batter_walks","batter_stolen_bases","pitcher_earned_runs","pitcher_hits_allowed",
    // batch 2 (gradeable now; walks-allowed resolves via "walks" -> pitcher BB):
    "batter_doubles","batter_triples","pitcher_walks",
    // batch 3: H+R+RBI (grade.js derives H+R+RBI)
    "batter_hits_runs_rbis","batter_singles",
    // pitcher outs (outs recorded) — starting-pitcher market, posts near game time:
    "pitcher_outs",
    // HR is usually a "to hit a HR" (1+) milestone -> alternate key
    "batter_home_runs_alternate",
  ],
};

const MARKET_LABELS = {
  player_anytime_td:"Anytime TD", player_first_td:"First TD",
  player_pass_yds:"Pass Yds", player_pass_tds:"Pass TDs", player_rush_yds:"Rush Yds",
  player_receptions:"Receptions", player_reception_yds:"Rec Yds",
  player_rush_tds:"Rush TDs", player_reception_tds:"Rec TDs",
  player_points:"Points", player_rebounds:"Rebounds", player_assists:"Assists",
  player_threes:"3-Pointers", player_points_rebounds_assists:"Pts+Reb+Ast",
  batter_home_runs:"Home Runs", batter_hits:"Hits", batter_total_bases:"Total Bases",
  batter_rbis:"RBIs", pitcher_strikeouts:"Strikeouts",
  batter_runs_scored:"Runs", batter_walks:"Walks", batter_stolen_bases:"Stolen Bases",
  pitcher_earned_runs:"Earned Runs", pitcher_hits_allowed:"Hits Allowed",
  batter_doubles:"Doubles", batter_triples:"Triples", pitcher_walks:"Walks Allowed",
  batter_hits_runs_rbis:"Hits+Runs+RBIs", batter_singles:"Singles", batter_home_runs_alternate:"Home Runs",
  pitcher_outs:"Outs",
};

export default async function handler(req, res) {
  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: "Missing sport parameter" });
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });
  const markets = PROP_MARKETS[sport];
  if (!markets) return res.status(400).json({ error: "No prop markets for sport" });

  try {
    const now = new Date().toISOString().split(".")[0] + "Z";
    const eventsRes = await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${apiKey}&dateFormat=iso&commenceTimeFrom=${now}`);
    if (!eventsRes.ok) return res.status(200).json({ props: [] });
    const events = await eventsRes.json();
    if (!Array.isArray(events) || events.length === 0) return res.status(200).json({ props: [] });

    events.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingEvents = events.filter(e => new Date(e.commence_time) <= cutoff);

    const props = [];
    const debugRows = req.query.debug ? [] : null; // ?debug=1 -> report which markets the API actually returns per game
    const marketsParam = markets.join(",");
    const bookmakers = "draftkings,fanduel,betmgm";

    // Was capped at 6 — a 15-game slate showed props for fewer than half the games, so the
    // later games were unpickable. The 5-min CDN cache above means this cost is paid once
    // per 5 min across ALL users, not per open, so a full slate is affordable. Hard ceiling
    // of 18 guards against a freak day (doubleheaders) blowing the Odds quota.
    const TODAY_CAP = 18;
    const slate = upcomingEvents.slice(0, TODAY_CAP);
    // Fetch every game's odds IN PARALLEL. Sequential await in a loop meant 18 games took
    // 6-9s of round-trips and risked a serverless timeout returning a partial/empty slate.
    // Promise.all makes 18 games cost about the same wall-time as 1.
    const results = await Promise.all(slate.map(async (event) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${event.id}/odds?apiKey=${apiKey}&regions=us&markets=${marketsParam}&bookmakers=${bookmakers}&oddsFormat=american`;
      try {
        const r = await fetch(url);
        if (!r.ok) return { event, data: null };
        return { event, data: await r.json() };
      } catch (e) { return { event, data: null }; }
    }));

    for (const { event, data } of results) {
      const gameLabel = `${event.away_team} @ ${event.home_team}`;
      if (!data) { if (debugRows) debugRows.push({ game: gameLabel, time: event.commence_time, note: "fetch failed", markets: [] }); continue; }
      if (!data.bookmakers || !data.bookmakers.length) { if (debugRows) debugRows.push({ game: gameLabel, time: event.commence_time, note: "no bookmakers returned", markets: [] }); continue; }
      if (debugRows) { const _ks = new Set(); data.bookmakers.forEach(bk => bk.markets?.forEach(m => _ks.add(m.key))); debugRows.push({ game: gameLabel, time: event.commence_time, hasHR: _ks.has("batter_home_runs") || _ks.has("batter_home_runs_alternate"), markets: [..._ks] }); }

      // Merge markets across ALL books (each book carries a different subset),
      // de-duping the same player+market+line+side so we don't triple-list it.
      const seen = new Set();
      data.bookmakers.forEach(bk => {
        bk.markets?.forEach(market => {
          const marketLabel = MARKET_LABELS[market.key] || market.key;
          const isTD = market.key === "player_anytime_td" || market.key === "player_first_td";
          market.outcomes?.forEach(outcome => {
            if (market.key === "batter_home_runs_alternate" && outcome.point !== 0.5) return;
            let label, dedupKey;
            if (isTD) {
              const player = outcome.name;
              label = `${player} - ${marketLabel}`;
              dedupKey = `${market.key}|${player}`;
            } else {
              const player = outcome.description || outcome.name;
              const direction = outcome.name === "Over" || outcome.name === "Under" ? outcome.name : "";
              const line = outcome.point != null ? outcome.point : "";
              label = `${player} ${direction} ${line} ${marketLabel}`.replace(/\s+/g, " ").trim();
              dedupKey = `${market.key}|${player}|${direction}|${line}`;
            }
            if (seen.has(dedupKey)) return;
            seen.add(dedupKey);
            props.push({
              id: `prop_${event.id}_${market.key}_${props.length}`,
              game: gameLabel,
              gameTime: event.commence_time,
              eventId: event.id,
              pick: label,
              market: market.key,
              odds: outcome.price >= 0 ? `+${outcome.price}` : `${outcome.price}`,
              impliedOdds: outcome.price,
            });
          });
        });
      });
    }

    if (debugRows) return res.status(200).json({ requested: markets, events: debugRows });

    // Props are identical for every user and all pre-game, so let Vercel's CDN serve one
    // upstream pull to all users per window instead of hitting the Odds API per client.
    // Never pin an empty slate: a short TTL lets real props reappear fast after a blip.
    if (props.length > 0) {
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    } else {
      res.setHeader("Cache-Control", "public, s-maxage=20");
    }
    return res.status(200).json({ props });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch props" });
  }
}