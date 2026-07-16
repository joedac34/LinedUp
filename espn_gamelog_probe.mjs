/**
 * espn_gamelog_probe.mjs — throwaway. Run: node espn_gamelog_probe.mjs
 *
 * Purpose: the Trends rebuild needs per-team RESULT game logs (final score, home/away,
 * date) to compute real backward-looking splits. findbet.js only ever proves out
 * /scoreboard, /summary and /standings — the /teams/{id}/schedule shape is unverified.
 * This prints exactly what comes back so the math gets built against reality.
 *
 * Paste the whole output back into the chat.
 */
const LG = {
  nfl: ["football", "nfl"],
  nba: ["basketball", "nba"],
  mlb: ["baseball", "mlb"],
};

const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

for (const [sport, [sp, lg]] of Object.entries(LG)) {
  console.log("\n" + "=".repeat(70) + `\n${sport.toUpperCase()}\n` + "=".repeat(70));
  try {
    const teams = await get(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/teams`);
    const list = teams?.sports?.[0]?.leagues?.[0]?.teams || [];
    console.log(`teams returned: ${list.length}`);
    const t = list[0]?.team;
    if (!t) { console.log("NO TEAMS — teams endpoint shape differs"); continue; }
    console.log(`probe team: id=${t.id} abbr=${t.abbreviation} name=${t.displayName}`);

    const sched = await get(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/teams/${t.id}/schedule`);
    const evs = sched?.events || [];
    console.log(`schedule events: ${evs.length}`);
    console.log(`schedule top-level keys: ${Object.keys(sched).join(", ")}`);
    if (sched.season) console.log(`season: ${JSON.stringify(sched.season)}`);

    // find the most recent COMPLETED event
    const done = evs.filter((e) => e?.competitions?.[0]?.status?.type?.completed);
    console.log(`completed events: ${done.length}`);
    const e = done[done.length - 1];
    if (!e) { console.log("NO COMPLETED EVENTS on this team's schedule"); continue; }

    const c = e.competitions[0];
    console.log("\n--- most recent completed event, trimmed ---");
    console.log(JSON.stringify({
      date: e.date,
      name: e.name,
      seasonType: e.seasonType,
      week: e.week,
      status: c.status?.type?.name,
      neutralSite: c.neutralSite,
      competitors: (c.competitors || []).map((x) => ({
        id: x.id,
        homeAway: x.homeAway,
        winner: x.winner,
        score: x.score,           // <-- string? object? THIS is the thing to confirm
        scoreType: typeof x.score,
        abbr: x.team?.abbreviation,
      })),
      competitionKeys: Object.keys(c),
    }, null, 2));
  } catch (err) {
    console.log("FAILED:", err.message);
  }
}
