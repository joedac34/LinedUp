export default async function handler(req, res) {
  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: "Missing sport parameter" });

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const now = new Date().toISOString().split(".")[0] + "Z";

  // Query a broad set of US books so we get coverage even if one hasn't posted
  // a line yet. We then collapse all of them into a single best-line bookmaker.
  const bookmakers = "draftkings,fanduel,betmgm,williamhill_us,betrivers";

  // American odds -> decimal payout (used to compare "best price")
  const decimal = (o) => (o > 0 ? o / 100 + 1 : 100 / Math.abs(o) + 1);

  // Pick the better of two outcomes for the SAME selection, per market type.
  function pickBetter(marketKey, name, a, b) {
    if (marketKey === "spreads") {
      // Higher point is always more favorable to the bettor
      // (favorite -3 beats -3.5; underdog +3.5 beats +3). Tie-break on price.
      if (b.point !== a.point) return b.point > a.point ? b : a;
      return decimal(b.price) > decimal(a.price) ? b : a;
    }
    if (marketKey === "totals") {
      // Over wants the LOWER line; Under wants the HIGHER line. Tie-break on price.
      const isOver = (name || "").toLowerCase() === "over";
      if (b.point !== a.point) return (isOver ? b.point < a.point : b.point > a.point) ? b : a;
      return decimal(b.price) > decimal(a.price) ? b : a;
    }
    // h2h (moneyline) and anything else: best price wins
    return decimal(b.price) > decimal(a.price) ? b : a;
  }

  // Collapse all bookmakers of a game into one "best line" bookmaker.
  function collapse(game) {
    const best = {}; // marketKey -> { selectionName -> outcome }
    for (const bk of game.bookmakers || []) {
      for (const mk of bk.markets || []) {
        const mKey = mk.key;
        if (!best[mKey]) best[mKey] = {};
        for (const oc of mk.outcomes || []) {
          const sel = oc.name;
          best[mKey][sel] = best[mKey][sel]
            ? pickBetter(mKey, sel, best[mKey][sel], oc)
            : { ...oc };
        }
      }
    }
    const markets = Object.entries(best).map(([key, outs]) => ({
      key,
      outcomes: Object.values(outs),
    }));
    return { ...game, bookmakers: markets.length ? [{ key: "best", title: "Best Line", markets }] : [] };
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&bookmakers=${bookmakers}&dateFormat=iso&oddsFormat=american&commenceTimeFrom=${now}`;
    const response = await fetch(url);
    if (!response.ok) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ games: [], remaining: null, used: null });
    }
    const data = await response.json();
    const remaining = response.headers.get("x-requests-remaining");
    const used = response.headers.get("x-requests-used");

    let games = Array.isArray(data) ? data.filter(g => g.bookmakers?.length > 0).map(collapse) : [];
    games.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ games, remaining, used });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch odds" });
  }
}