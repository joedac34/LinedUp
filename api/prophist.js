// Player prop history: last-N game logs for the prop history sheet.
// Proxied server-side so both the web app and the native shell (capacitor://localhost)
// avoid CORS entirely — same reasoning as /api/espn.
//
//   GET /api/prophist?sport=mlb&name=Aaron%20Judge
//   GET /api/prophist?sport=nfl&name=Josh%20Allen
//
// Response: { player:{id,name,position}, groups:{ hitting:[games], pitching:[games] } }  (mlb)
//           { player:{id,name,position}, groups:{ nfl:[games] } }                        (nfl)
// Each game: { date, opp, home, stats:{ <raw stat map> } }, most recent FIRST.
// The client maps market_key -> stat and slices to 10; the endpoint stays market-agnostic
// so new tabs never need a server change.

const N_GAMES = 15;

function seasonYear() {
  // MLB/NFL seasons are labeled by their start year; January-February games belong
  // to the prior label. Good enough for game logs.
  const d = new Date();
  return d.getMonth() < 2 ? d.getFullYear() - 1 : d.getFullYear();
}

async function j(url) {
  const r = await fetch(url, { headers: { "User-Agent": "picklock/1.0" } });
  if (!r.ok) throw new Error("upstream " + r.status + " for " + url);
  return r.json();
}

// ── MLB: StatsAPI (free, keyless) ────────────────────────────────────────────
async function mlb(name) {
  const season = seasonYear();
  const search = await j(
    "https://statsapi.mlb.com/api/v1/people/search?names=" + encodeURIComponent(name)
  );
  const people = (search && search.people) || [];
  // Prefer the active player on an exact-ish name hit; StatsAPI ranks well already.
  const person = people.find((p) => p.active) || people[0];
  if (!person) return null;

  const logs = await j(
    "https://statsapi.mlb.com/api/v1/people/" + person.id +
    "/stats?stats=gameLog&group=hitting,pitching&season=" + season
  );
  const groups = {};
  ((logs && logs.stats) || []).forEach((st) => {
    const g = st.group && st.group.displayName; // "hitting" | "pitching"
    if (!g) return;
    const splits = (st.splits || [])
      .slice(-N_GAMES)
      .reverse() // most recent first
      .map((s) => ({
        date: s.date || null,
        opp: (s.opponent && (s.opponent.abbreviation || s.opponent.name)) || "",
        home: s.isHome === true,
        stats: s.stat || {},
      }));
    if (splits.length) groups[g] = splits;
  });
  return {
    player: {
      id: person.id,
      name: person.fullName || name,
      position: (person.primaryPosition && person.primaryPosition.abbreviation) || "",
    },
    groups,
  };
}

// ── NFL: ESPN (unofficial) ───────────────────────────────────────────────────
// Empty until the regular season produces game logs; the sheet shows its
// "history lands with the season" state on an empty groups map.
async function nfl(name) {
  const search = await j(
    "https://site.web.api.espn.com/apis/search/v2?limit=5&type=player&query=" +
    encodeURIComponent(name)
  );
  let athleteId = null, dispName = name, pos = "";
  const results = (search && search.results) || [];
  for (const rg of results) {
    for (const it of rg.contents || []) {
      const uid = String(it.uid || "");
      const m = uid.match(/a:(\d+)/);
      const isNfl = /nfl/i.test(String(it.defaultLeagueSlug || it.subtitle || ""));
      if (m && (isNfl || !athleteId)) {
        athleteId = m[1];
        dispName = it.displayName || name;
        pos = it.subtitle || "";
        if (isNfl) break;
      }
    }
    if (athleteId) break;
  }
  if (!athleteId) return null;

  const log = await j(
    "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/" +
    athleteId + "/gamelog"
  );
  // ESPN gamelog: `names` (stat keys) + seasonTypes[].categories[].events[{eventId,stats[]}]
  // + `events` map keyed by eventId with date/opponent.
  const keys = (log && log.names) || [];
  const evMeta = (log && log.events) || {};
  const rows = [];
  for (const stype of (log && log.seasonTypes) || []) {
    for (const cat of stype.categories || []) {
      for (const ev of cat.events || []) {
        const meta = evMeta[ev.eventId] || {};
        const stats = {};
        keys.forEach((k, i) => { stats[k] = ev.stats && ev.stats[i]; });
        rows.push({
          date: meta.gameDate || null,
          opp: (meta.opponent && (meta.opponent.abbreviation || meta.opponent.displayName)) || "",
          home: meta.atVs === "vs",
          stats,
        });
      }
    }
  }
  rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return {
    player: { id: athleteId, name: dispName, position: pos },
    groups: rows.length ? { nfl: rows.slice(0, N_GAMES) } : {},
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sport = String(req.query.sport || "").toLowerCase();
  const name = String(req.query.name || "").trim();
  if (!name || !["mlb", "nfl"].includes(sport)) {
    return res.status(400).json({ error: "sport (mlb|nfl) and name required" });
  }
  try {
    const data = sport === "mlb" ? await mlb(name) : await nfl(name);
    if (!data) return res.status(404).json({ error: "player not found" });
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).json(data);
  } catch (err) {
    console.error("prophist error:", err && err.message);
    return res.status(500).json({ error: "history unavailable" });
  }
}
