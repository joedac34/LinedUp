/* api/cfb-tags.js — conference + AP Top 25 tags for every FBS team on this
 * week's board, from ESPN's scoreboard (keyless, free). The browser uses this
 * to filter the college slate: "SEC", "Big Ten", "Top 25", etc.
 *
 * GET /api/cfb-tags -> { teams: { "<ESPN displayName>": { conf, rank } }, confs: [...], updatedAt }
 *   rank: 1..25 or null.  conf: short label ("SEC") or "Other".
 *
 * Team names: ESPN displayName ("Georgia Bulldogs") matches the Odds API team
 * string used in every bet's `game` field, so the client can match directly.
 * A few differ in nickname spacing/punctuation; the client normalises both.
 *
 * ESPN's college-football scoreboard returns ONLY Top-25 games unless groups=80
 * (all FBS). limit=300 covers a full Saturday. conferenceId values are ESPN's
 * group ids; unknown ids fall to "Other" so a realignment never blanks a chip.
 */
const CONF = {
  "8": "SEC", "5": "Big Ten", "4": "Big 12", "1": "ACC", "9": "Pac-12",
  "151": "American", "17": "Mountain West", "37": "Sun Belt", "15": "MAC", "12": "CUSA", "18": "Independent",
};
const ORDER = ["SEC", "Big Ten", "Big 12", "ACC", "Independent", "Pac-12", "American", "Mountain West", "Sun Belt", "MAC", "CUSA", "Other"];

let _mem = null; let _at = 0;
const TTL = 20 * 60 * 1000;

export default async function handler(req, res) {
  try {
    if (_mem && Date.now() - _at < TTL) {
      res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
      return res.status(200).json(_mem);
    }
    const base = "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300";
    // This week's slate plus next week's, so a Sunday/Monday browse of the
    // upcoming Saturday is already tagged.
    const urls = [base];
    try {
      const d = new Date(); d.setUTCDate(d.getUTCDate() + 7);
      const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
      urls.push(base + "&dates=" + ymd);
    } catch (e) {}
    const teams = {};
    for (const u of urls) {
      try {
        const r = await fetch(u);
        if (!r.ok) continue;
        const data = await r.json();
        for (const ev of (data.events || [])) {
          const comp = ev.competitions && ev.competitions[0];
          for (const c of ((comp && comp.competitors) || [])) {
            const t = c.team || {};
            const name = t.displayName;
            if (!name) continue;
            const cr = c.curatedRank && Number(c.curatedRank.current);
            const rank = (cr && cr >= 1 && cr <= 25) ? cr : null;
            const conf = CONF[String(t.conferenceId || "")] || "Other";
            const prev = teams[name] || {};
            teams[name] = { conf: prev.conf && prev.conf !== "Other" ? prev.conf : conf, rank: prev.rank || rank, abbr: t.abbreviation || prev.abbr || "" };
          }
        }
      } catch (e) { /* one week failing must not blank the other */ }
    }
    const present = new Set(Object.values(teams).map(t => t.conf));
    const confs = ORDER.filter(c => present.has(c));
    const out = { teams, confs, updatedAt: new Date().toISOString() };
    if (Object.keys(teams).length) { _mem = out; _at = Date.now(); }
    res.setHeader("Cache-Control", Object.keys(teams).length ? "public, s-maxage=600, stale-while-revalidate=1800" : "public, s-maxage=30");
    return res.status(200).json(out);
  } catch (e) {
    return res.status(200).json({ teams: {}, confs: [], error: String(e && e.message || e) });
  }
}
