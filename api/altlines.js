// /api/altlines — alternate lines for ONE bet, on demand (game lines + player props).
// Cap: nothing longer than +1000. Query: sport, event, market, name?(team), player?(prop), debug?
// Returns: { market, sides: [ { name, lines: [ { point, odds, impliedOdds } ] } ] }

const CAP = 1000;

function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}
// lenient match: exact / contains / same last word (last name). Handles minor name diffs.
function nameMatch(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  return x.split(" ").pop() === y.split(" ").pop();
}

// ── Caller verification (SOFT by default) ────────────────────────────────────
// These endpoints spend metered Odds API credits, so they should require a real
// Supabase user token. BUT the native app ships a frozen copy of App.jsx: a build
// compiled before the client started sending Authorization headers cannot be
// patched without an App Store release. Rejecting those callers takes odds away
// from every tester on an older build.
//
// So: verify, LOG, and let it through. Set ODDS_REQUIRE_AUTH=1 in Vercel env once
// the logs show no more anonymous callers (i.e. every tester has updated), and
// this starts returning 401 with no code change.
const ENFORCE_AUTH = process.env.ODDS_REQUIRE_AUTH === "1";

async function requireUser(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  const base = process.env.VITE_SUPABASE_URL;
  const apikey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !apikey) return null;
  try {
    const r = await fetch(base + "/auth/v1/user", {
      headers: { apikey, Authorization: "Bearer " + token },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u : null;
  } catch (e) { return null; }
}

// Returns true if the request should be REJECTED.
async function authBlocked(req, route) {
  const caller = await requireUser(req);
  if (caller) return false;
  if (ENFORCE_AUTH) return true;
  // Grep these in Vercel logs to see when legacy clients have drained away.
  console.warn("[anon-call] " + route + " ua=" + String(req.headers["user-agent"] || "").slice(0, 80));
  return false;
}

export default async function handler(req, res) {
  if (await authBlocked(req, "altlines")) return res.status(401).json({ error: "unauthorized" });
  const sport  = req.query.sport;
  const event  = req.query.event;
  const market = req.query.market;
  const name   = req.query.name || "";
  const player = req.query.player || "";
  const debug  = req.query.debug;
  const apiKey = process.env.ODDS_API_KEY;

  if (!sport || !event || !market) return res.status(400).json({ error: "missing sport/event/market" });
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  // Game lines use the PREFIX form (alternate_spreads/alternate_totals); props use
  // the SUFFIX form ({market}_alternate). Map accordingly.
  const GAME_ALT = { spreads: "alternate_spreads", totals: "alternate_totals", h2h: "alternate_h2h" };
  const altMarket = GAME_ALT[market] || (market.endsWith("_alternate") ? market : `${market}_alternate`);

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${event}/odds`
      + `?apiKey=${apiKey}&regions=us&markets=${altMarket}`
      + `&oddsFormat=american&dateFormat=iso&bookmakers=draftkings,fanduel,betmgm`;
    const r = await fetch(url);
    if (!r.ok) {
      res.setHeader("Cache-Control", "public, s-maxage=20");
      return res.status(200).json({ market: altMarket, sides: [], note: `odds_api_${r.status}` });
    }
    const data = await r.json();

    // ?debug=1 -> raw dump of what the alternate market actually returned (no filtering)
    if (debug) {
      const raw = [];
      (data.bookmakers || []).forEach(bk => (bk.markets || []).forEach(mk => {
        if (mk.key !== altMarket) return;
        (mk.outcomes || []).forEach(o => raw.push({ name: o.name, desc: o.description, point: o.point, price: o.price }));
      }));
      const marketsSeen = new Set();
      (data.bookmakers || []).forEach(bk => (bk.markets || []).forEach(mk => marketsSeen.add(mk.key)));
      return res.status(200).json({ requested: { market: altMarket, name, player }, marketsReturned: [...marketsSeen], count: raw.length, sample: raw.slice(0, 50) });
    }

    const groups = {}; // name -> { point -> {point, price} }
    (data.bookmakers || []).forEach(bk => (bk.markets || []).forEach(mk => {
      if (mk.key !== altMarket) return;
      (mk.outcomes || []).forEach(o => {
        if (o.point == null) return;
        if (player && !nameMatch(o.description || "", player)) return;
        if (name && !nameMatch(o.name || "", name)) return;
        if (typeof o.price !== "number" || o.price > CAP) return;
        const g = (groups[o.name] = groups[o.name] || {});
        if (!g[o.point] || o.price > g[o.point].price) g[o.point] = { point: o.point, price: o.price };
      });
    }));

    const sides = Object.keys(groups).map(nm => ({
      name: nm,
      lines: Object.values(groups[nm])
        .map(l => ({ point: l.point, odds: l.price >= 0 ? `+${l.price}` : `${l.price}`, impliedOdds: l.price }))
        .sort((a, b) => a.point - b.point),
    })).filter(s => s.lines.length);

    res.setHeader("Cache-Control", sides.length
      ? "public, s-maxage=120, stale-while-revalidate=300"
      : "public, s-maxage=20");
    return res.status(200).json({ market: altMarket, player, sides });
  } catch (e) {
    return res.status(200).json({ market: altMarket, sides: [], note: "error" });
  }
}