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
// Static Power-4 fallback used only when ESPN omits conferenceId for a team.
// Matched on the school part of displayName ("Georgia Bulldogs" -> "Georgia").
const P4 = {
  "SEC": ["Alabama","Arkansas","Auburn","Florida","Georgia","Kentucky","LSU","Mississippi State","Missouri","Oklahoma","Ole Miss","South Carolina","Tennessee","Texas","Texas A&M","Vanderbilt"],
  "Big Ten": ["Illinois","Indiana","Iowa","Maryland","Michigan","Michigan State","Minnesota","Nebraska","Northwestern","Ohio State","Oregon","Penn State","Purdue","Rutgers","UCLA","USC","Washington","Wisconsin"],
  "Big 12": ["Arizona","Arizona State","Baylor","BYU","Cincinnati","Colorado","Houston","Iowa State","Kansas","Kansas State","Oklahoma State","TCU","Texas Tech","UCF","Utah","West Virginia"],
  "ACC": ["Boston College","California","Clemson","Duke","Florida State","Georgia Tech","Louisville","Miami","North Carolina","NC State","Pittsburgh","SMU","Stanford","Syracuse","Virginia","Virginia Tech","Wake Forest"],
  "Independent": ["Notre Dame","UConn"],
};
const P4_BY_SCHOOL = {};
for (const [conf, list] of Object.entries(P4)) for (const school of list) P4_BY_SCHOOL[school.toLowerCase()] = conf;
function confFromName(displayName, location) {
  const loc = String(location || "").toLowerCase();
  if (loc && P4_BY_SCHOOL[loc]) return P4_BY_SCHOOL[loc];
  const dn = String(displayName || "").toLowerCase();
  for (const school in P4_BY_SCHOOL) if (dn.startsWith(school + " ")) return P4_BY_SCHOOL[school];
  return null;
}

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
            const cr = Number((c.curatedRank && c.curatedRank.current) ?? c.rank ?? (t.rank) ?? 99);
            const rank = (cr >= 1 && cr <= 25) ? cr : null;
            const cid = t.conferenceId || (t.conference && t.conference.id) || (t.groups && t.groups.id) || "";
            const conf = CONF[String(cid)] || confFromName(name, t.location) || "Other";
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