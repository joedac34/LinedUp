// /api/altlines — fetches alternate lines for ONE bet, on demand.
// Works for game lines (spreads, totals) and player props (e.g. batter_total_bases).
// Only ever hit when a user opens the Alt sheet, so cost scales with actual use.
// Cap: nothing longer than +1000 is returned (enforced here AND on the client).
//
// Query: sport, event (eventId), market (base key like "spreads"/"totals"/"batter_hits"),
//        name (optional: team for spreads), player (optional: player description for props)
// Returns: { market, sides: [ { name, lines: [ { point, odds, impliedOdds } ] } ] }

const CAP = 1000; // max American odds we'll surface

export default async function handler(req, res) {
  const sport  = req.query.sport;
  const event  = req.query.event;
  const market = req.query.market;
  const name   = req.query.name || "";
  const player = req.query.player || "";
  const apiKey = process.env.ODDS_API_KEY;

  if (!sport || !event || !market) return res.status(400).json({ error: "missing sport/event/market" });
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const altMarket = market.endsWith("_alternate") ? market : `${market}_alternate`;

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${event}/odds`
      + `?apiKey=${apiKey}&regions=us&markets=${altMarket}`
      + `&oddsFormat=american&dateFormat=iso&bookmakers=draftkings,fanduel,betmgm`;
    const r = await fetch(url);
    if (!r.ok) { res.setHeader("Cache-Control", "public, s-maxage=20"); return res.status(200).json({ market: altMarket, sides: [] }); }
    const data = await r.json();

    // group by outcome name (Over/Under, or team); best price per point; filter to
    // the requested player (props) / name (spreads); drop anything longer than the cap.
    const groups = {}; // name -> { point -> {point, price} }
    (data.bookmakers || []).forEach(bk => (bk.markets || []).forEach(mk => {
      if (mk.key !== altMarket) return;
      (mk.outcomes || []).forEach(o => {
        if (o.point == null) return;
        if (player && (o.description || "") !== player) return;
        if (name && o.name !== name) return;
        if (typeof o.price !== "number" || o.price > CAP) return; // cap
        const g = (groups[o.name] = groups[o.name] || {});
        if (!g[o.point] || o.price > g[o.point].price) g[o.point] = { point: o.point, price: o.price };
      });
    }));

    const sides = Object.keys(groups).map(nm => {
      const lines = Object.values(groups[nm])
        .map(l => ({ point: l.point, odds: l.price >= 0 ? `+${l.price}` : `${l.price}`, impliedOdds: l.price }))
        .sort((a, b) => a.point - b.point);
      return { name: nm, lines };
    }).filter(s => s.lines.length);

    res.setHeader("Cache-Control", sides.length
      ? "public, s-maxage=120, stale-while-revalidate=300"
      : "public, s-maxage=20");
    return res.status(200).json({ market: altMarket, player, sides });
  } catch (e) {
    return res.status(200).json({ market: altMarket, sides: [] });
  }
}
