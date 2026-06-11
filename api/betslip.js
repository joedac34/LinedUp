/**
 * /api/betslip.js — resolve a sportsbook betslip deep link for one bet.
 *
 * Provider-agnostic by design:
 *   - "oddsapi"  : implemented now. Uses The Odds API includeLinks/includeSids to
 *                  return the deepest available betslip link per book.
 *   - "metabet"  : stub. When you onboard MetaBet, plug your publisher id + their
 *                  ExpressLink format into metabetLink() and flip PROVIDER.
 *
 * Affiliate monetization: AFFILIATE holds a per-book tracking param. Empty = links
 * still work, they just earn nothing. Fill it (or switch to metabet) once you have
 * deals. A book with no entry simply opens un-tagged.
 *
 * ENV: ODDS_API_KEY
 */

const ODDS = process.env.ODDS_API_KEY;
const SPORT_KEYS = { nfl: "americanfootball_nfl", nba: "basketball_nba", mlb: "baseball_mlb" };

const PROVIDER = "oddsapi"; // "oddsapi" | "metabet"

// Per-book affiliate tracking (you fill these once you have deals). Example shape:
// { fanduel: { param: "btag", value: "YOUR_ID" } }
const AFFILIATE = {};

// MetaBet (when onboarded): set your publisher id and confirm their link format.
const METABET_PUB_ID = "";

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
function teamMatch(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  return x.split(" ").pop() === y.split(" ").pop();
}
function parseTeams(game) {
  const s = (game || "").trim();
  if (s.includes("@")) { const p = s.split("@"); return { away: p[0].trim(), home: p[1].trim() }; }
  const m = s.split(/\s+(?:vs\.?|at)\s+/i);
  if (m.length === 2) return { away: m[0].trim(), home: m[1].trim() };
  return { away: "", home: "" };
}

// Strip " ML" / trailing odds off an h2h pick to get the team.
function teamFromPick(pick) {
  return (pick || "").replace(/\s+ML\s*$/i, "").replace(/\s+[+-]\d+(\.\d+)?\s*$/, "").trim();
}
function ouFromPick(pick, point) {
  const p = (pick || "").toLowerCase();
  const side = p.includes("over") ? "Over" : p.includes("under") ? "Under" : null;
  const num = point != null ? parseFloat(point) : parseFloat((pick.match(/-?\d+(\.\d+)?/) || [])[0]);
  return { side, num };
}
function spreadFromPick(pick, point) {
  const m = (pick || "").match(/^(.*?)([+-]\d+(\.\d+)?)\s*$/);
  const team = m ? m[1].trim() : teamFromPick(pick);
  const num = point != null ? parseFloat(point) : (m ? parseFloat(m[2]) : null);
  return { team, num };
}

function addAffiliate(link, bookKey) {
  const a = AFFILIATE[bookKey];
  if (!link || !a || !a.value) return link;
  const sep = link.includes("?") ? "&" : "?";
  return `${link}${sep}${encodeURIComponent(a.param)}=${encodeURIComponent(a.value)}`;
}

// Deepest available link: outcome -> market -> bookmaker(event) link.
function deepestLink(bk, mk, outcome) {
  return (outcome && outcome.link) || (mk && mk.link) || (bk && bk.link) || null;
}

function selectionMatch(category, outcome, sel) {
  if (category === "ou") {
    if (!sel.side) return false;
    if (String(outcome.name).toLowerCase() !== sel.side.toLowerCase()) return false;
    return sel.num == null || outcome.point == null || Math.abs(outcome.point - sel.num) < 0.01;
  }
  if (category === "spread") {
    if (!teamMatch(outcome.name, sel.team)) return false;
    return sel.num == null || outcome.point == null || Math.abs(outcome.point - sel.num) < 0.26;
  }
  return teamMatch(outcome.name, sel.team); // h2h
}

async function oddsapiLinks(ctx) {
  const sk = SPORT_KEYS[ctx.sport]; if (!sk || !ODDS) return [];
  const market = ctx.category === "ou" ? "totals" : ctx.category === "spread" ? "spreads" : "h2h";
  const url = `https://api.the-odds-api.com/v4/sports/${sk}/odds?apiKey=${ODDS}&regions=us&markets=${market}&oddsFormat=american&includeLinks=true&includeSids=true`;
  const r = await fetch(url); if (!r.ok) throw new Error(`Odds API ${r.status}`);
  const events = await r.json();
  const { away, home } = parseTeams(ctx.game);
  const event = (events || []).find(e =>
    (teamMatch(e.home_team, home) && teamMatch(e.away_team, away)) ||
    (teamMatch(e.home_team, away) && teamMatch(e.away_team, home))
  );
  if (!event) return [];
  const sel = ctx.category === "ou" ? ouFromPick(ctx.pick, ctx.point)
    : ctx.category === "spread" ? spreadFromPick(ctx.pick, ctx.point)
    : { team: teamFromPick(ctx.pick) };

  const out = [];
  for (const bk of (event.bookmakers || [])) {
    const mk = (bk.markets || []).find(m => m.key === market); if (!mk) continue;
    const oc = (mk.outcomes || []).find(o => selectionMatch(ctx.category, o, sel)); if (!oc) continue;
    const link = deepestLink(bk, mk, oc); if (!link) continue;
    out.push({ book: bk.key, title: bk.title, price: oc.price, link: addAffiliate(link, bk.key) });
  }
  out.sort((a, b) => b.price - a.price); // best price first
  return out;
}

// Stub — fill once you have MetaBet onboarding details.
function metabetLinks(/* ctx */) {
  if (!METABET_PUB_ID) return [];
  // TODO: build ExpressLink(s) from MetaBet's documented format using METABET_PUB_ID.
  return [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const ctx = req.body || {};
    if (!ctx.game || !ctx.sport || !ctx.pick) return res.status(400).json({ error: "Missing game/sport/pick" });
    const links = PROVIDER === "metabet" ? metabetLinks(ctx) : await oddsapiLinks(ctx);
    if (!links.length) return res.status(200).json({ best: null, all: [] });
    return res.status(200).json({ best: links[0], all: links.slice(0, 6), provider: PROVIDER });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
