// api/eventodds.js — fetch period / additional markets one event at a time.
//
// Period markets (1st half, first-5 innings, 1st-inning YRFI/NRFI) are NOT available
// on the bulk /odds endpoint — they must be pulled per-event via /events/{id}/odds,
// which costs (markets × regions) credits per call. The client calls this lazily,
// only for the games in a custom league that actually has a period slot, and caches.
//
//   GET /api/eventodds?sport=americanfootball_nfl&events=ID1,ID2&markets=h2h_h1,spreads_h1,totals_h1
//   -> { bets: [ { category, game, pick, odds, impliedOdds, gameTime, eventId,
//                  marketKey, outcome, point, selKey } ] }

const ODDS_KEY = process.env.ODDS_API_KEY;

// Odds API market key -> PickLock slot category
const CAT = {
  h2h_h1: "ml_h1", spreads_h1: "spread_h1", totals_h1: "ou_h1",
  h2h_1st_5_innings: "ml_f5", spreads_1st_5_innings: "spread_f5", totals_1st_5_innings: "ou_f5",
  // totals_1st_1_innings is split into yrfi (Over 0.5) / nrfi (Under 0.5) below
};

const american = (p) => (p >= 0 ? `+${p}` : `${p}`);

async function fetchEvent(sport, eventId, markets) {
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${eventId}/odds` +
    `?apiKey=${ODDS_KEY}&regions=us&markets=${markets}&oddsFormat=american&dateFormat=iso`;
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
}

export default async function handler(req, res) {
  if (!ODDS_KEY) return res.status(500).json({ error: "no odds key" });
  const sport = req.query.sport;
  const events = (req.query.events || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 30);
  const markets = (req.query.markets || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!sport || !events.length || !markets.length) {
    return res.status(400).json({ error: "sport, events, markets required" });
  }
  const bets = [];
  for (const eventId of events) {
    let data;
    try { data = await fetchEvent(sport, eventId, markets.join(",")); } catch (e) { continue; }
    if (!data || !data.id) continue;
    const home = data.home_team, away = data.away_team;
    const gameLabel = `${away} @ ${home}`;

    // Collapse to the best price per (market, outcome name, point) across books.
    const best = {};
    for (const bk of (data.bookmakers || [])) {
      for (const mk of (bk.markets || [])) {
        if (!markets.includes(mk.key)) continue;
        for (const oc of (mk.outcomes || [])) {
          const pt = (oc.point != null ? oc.point : "");
          const k = `${mk.key}|${oc.name}|${pt}`;
          if (!best[k] || oc.price > best[k].price) {
            best[k] = { marketKey: mk.key, name: oc.name, point: (oc.point != null ? oc.point : null), price: oc.price };
          }
        }
      }
    }

    for (const k in best) {
      const o = best[k];
      let category = CAT[o.marketKey];
      let pickLabel;
      if (o.marketKey === "totals_1st_1_innings") {
        const isOver = /over/i.test(o.name);
        category = isOver ? "yrfi" : "nrfi";
        pickLabel = isOver ? "Yes Run — 1st Inning" : "No Run — 1st Inning";
      } else if (!category) {
        continue;
      } else if (o.marketKey.startsWith("totals")) {
        pickLabel = `${o.name} ${o.point}`;
      } else if (o.marketKey.startsWith("spreads")) {
        pickLabel = `${o.name} ${o.point >= 0 ? "+" + o.point : o.point}`;
      } else { // h2h
        pickLabel = o.name;
      }
      bets.push({
        category, game: gameLabel, pick: pickLabel,
        odds: american(o.price), impliedOdds: o.price,
        gameTime: data.commence_time, eventId: data.id,
        marketKey: o.marketKey, outcome: o.name, point: o.point,
        selKey: `${data.id}|${o.marketKey}|${o.name}|${o.point != null ? o.point : ""}`,
      });
    }
  }
  return res.status(200).json({ bets });
}
