// /api/market-probe.js — is a market key VALID and POSTED for a given sport?
//
// Why this exists: The Odds API returns 422 for the WHOLE request if any single
// market key is invalid for that sport. On 30 Aug 2026 one bad key in a batch of
// nine made it look like soccer had no player props at all. Worse, adding an
// unverified key to a sport's list in props.js would 422 that sport's entire
// props request — i.e. adding team_totals to NFL blind could take down every NFL
// prop eleven days before Week 1.
//
// So: probe each market SEPARATELY, and never add a key to props.js until it
// shows up here as ok:true.
//
//   /api/market-probe?sport=americanfootball_nfl&markets=team_totals,alternate_spreads
//   /api/market-probe?sport=basketball_nba&markets=team_totals
//
// Reads three states apart:
//   ok:false            -> key is INVALID for this sport. Never add it.
//   ok:true, posted:false -> valid but no book is pricing it right now.
//   ok:true, posted:true  -> safe to wire, with a sample of the outcome shape.

const DEFAULT_MARKETS = "team_totals,alternate_spreads,alternate_totals";

async function j(url) {
  const r = await fetch(url);
  let body = null;
  try { body = await r.json(); } catch (e) { body = null; }
  return { ok: r.ok, status: r.status, body };
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const ODDS_KEY = process.env.ODDS_API_KEY;
  if (!ODDS_KEY) return res.status(500).json({ error: "no odds key" });

  const sport = String((req.query && req.query.sport) || "americanfootball_nfl");
  const markets = String((req.query && req.query.markets) || DEFAULT_MARKETS)
    .split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12);

  const out = { sport, generatedAt: new Date().toISOString() };
  try {
    // Grab one upcoming event to probe against.
    const ev = await j(`https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${ODDS_KEY}`);
    const games = (ev.ok && Array.isArray(ev.body)) ? ev.body : [];
    if (!games.length) {
      return res.status(200).json({ ...out, note: "no upcoming events for this sport", status: ev.status });
    }
    const g = games[0];
    out.eventTried = `${g.away_team} @ ${g.home_team}`;
    out.commence = g.commence_time;

    const detail = {};
    for (const mk of markets) {
      const r = await j(`https://api.the-odds-api.com/v4/sports/${sport}/events/${g.id}/odds`
        + `?apiKey=${ODDS_KEY}&regions=us&markets=${mk}&oddsFormat=american`);
      if (!r.ok) { detail[mk] = { ok: false, status: r.status }; continue; }
      const found = ((r.body && r.body.bookmakers) || []).flatMap((b) => (b.markets || []).filter((m) => m.key === mk));
      if (!found.length) { detail[mk] = { ok: true, posted: false }; continue; }
      detail[mk] = {
        ok: true, posted: true,
        books: new Set(((r.body && r.body.bookmakers) || []).filter((b) => (b.markets || []).some((m) => m.key === mk)).map((b) => b.key)).size,
        // Shape matters as much as presence: team_totals carries the team in
        // description, the direction in name, and the line in point.
        sample: (found[0].outcomes || []).slice(0, 4).map((o) => ({ name: o.name, description: o.description, point: o.point, price: o.price })),
      };
    }
    out.safeToWire = Object.keys(detail).filter((k) => detail[k].ok && detail[k].posted);
    out.invalidKey = Object.keys(detail).filter((k) => detail[k].ok === false);
    out.detail = detail;
  } catch (e) {
    out.error = String((e && e.message) || e);
  }
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(out);
}
