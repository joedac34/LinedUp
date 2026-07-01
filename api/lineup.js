/* MLB starting lineup + per-batter season stats + team-specific standings.
   Place at: api/lineup.js   (free/keyless MLB StatsAPI — no quota cost)

   GET /api/lineup?away=<team>&home=<team>&date=YYYY-MM-DD
     (or) /api/lineup?gamePk=<id>

   Returns:
   {
     posted: bool,                // true if either side has a confirmed batting order
     gamePk: number|null,
     away: { team, posted, pitcherHand, lineup:[{order,name,pos,bat,avg,hr,rbi,ops}], teamStats:{...} },
     home: { ...same... }
   }
   teamStats: { wins, losses, pct, runDiff, streak, lastTen }  — all team-specific.

   Everything is best-effort: any sub-fetch that fails degrades to empty/null, never 500s the whole thing. */

const SA = "https://statsapi.mlb.com/api/v1";

const norm = (s) => (s || "")
  .toLowerCase()
  .replace(/[^a-z0-9 ]/g, "")
  .replace(/\b(baseball club|club)\b/g, "")
  .trim();

// "Michael McGreevy" -> "M. McGreevy"
function shortName(full) {
  if (!full) return "";
  const p = full.trim().split(/\s+/);
  if (p.length === 1) return p[0];
  return p[0][0] + ". " + p.slice(1).join(" ");
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("statsapi " + r.status);
  return r.json();
}

// Resolve a game (gamePk + probable pitcher ids) from team names + date via the schedule.
async function resolveGame(away, home, date) {
  const day = (date || new Date().toISOString()).split("T")[0];
  const sched = await getJSON(`${SA}/schedule?sportId=1&date=${day}&hydrate=probablePitcher`);
  const games = (sched.dates || []).flatMap((d) => d.games || []);
  const a = norm(away), h = norm(home);
  let hit = games.find((g) => {
    const gh = norm(g.teams?.home?.team?.name), ga = norm(g.teams?.away?.team?.name);
    return (gh.includes(h) || h.includes(gh)) && (ga.includes(a) || a.includes(ga));
  });
  if (!hit) hit = games.find((g) => {
    const gh = norm(g.teams?.home?.team?.name), ga = norm(g.teams?.away?.team?.name);
    return gh.includes(h) || h.includes(gh) || ga.includes(a) || a.includes(ga);
  });
  if (!hit) return { gamePk: null, awayPid: null, homePid: null };
  return {
    gamePk: hit.gamePk,
    awayPid: hit.teams?.away?.probablePitcher?.id || null,
    homePid: hit.teams?.home?.probablePitcher?.id || null,
  };
}

// batSide + pitchHand (L/R/S) are not in the boxscore — batch them from /people.
async function peopleMap(ids) {
  const map = {};
  if (!ids.length) return map;
  try {
    const data = await getJSON(`${SA}/people?personIds=${ids.join(",")}`);
    for (const p of (data.people || [])) map[p.id] = { bat: p.batSide?.code || "", hand: p.pitchHand?.code || "" };
  } catch (e) { /* leave blank */ }
  return map;
}

function extractSide(box, side, bats) {
  const t = box.teams?.[side];
  if (!t) return { team: "", posted: false, lineup: [] };
  const order = t.battingOrder || [];               // array of personIds, in order
  const players = t.players || {};
  const lineup = order.map((pid, i) => {
    const pl = players["ID" + pid] || {};
    const bat = pl.seasonStats?.batting || {};
    return {
      order: i + 1,
      name: shortName(pl.person?.fullName),
      pos: pl.position?.abbreviation || "",
      bat: (bats[pid] && bats[pid].bat) || "",
      avg: bat.avg ?? "—",
      hr: bat.homeRuns ?? 0,
      rbi: bat.rbi ?? 0,
      ops: bat.ops ?? "—",
    };
  });
  return { team: t.team?.name || "", posted: lineup.length >= 9, lineup };
}

// Team-specific standings row -> the bottom stat tiles (L10 / run diff / win% / streak).
async function teamStatsMap() {
  const map = {};
  try {
    const yr = new Date().getUTCFullYear();
    const data = await getJSON(`${SA}/standings?leagueId=103,104&season=${yr}&standingsTypes=regularSeason`);
    for (const rec of (data.records || [])) {
      for (const tr of (rec.teamRecords || [])) {
        const id = tr.team?.id;
        if (!id) continue;
        const last10 = (tr.records?.splitRecords || []).find((s) => s.type === "lastTen");
        map[id] = {
          wins: tr.wins ?? null,
          losses: tr.losses ?? null,
          pct: tr.winningPercentage ?? null,
          runDiff: (tr.runDifferential != null)
            ? tr.runDifferential
            : ((tr.runsScored != null && tr.runsAllowed != null) ? tr.runsScored - tr.runsAllowed : null),
          streak: tr.streak?.streakCode ?? null,
          lastTen: last10 ? `${last10.wins}-${last10.losses}` : null,
        };
      }
    }
  } catch (e) { /* map stays empty -> tiles show — */ }
  return map;
}

export default async function handler(req, res) {
  try {
    const { away, home, date } = req.query;
    let gamePk = req.query.gamePk ? Number(req.query.gamePk) : null;
    let awayPid = null, homePid = null;

    if (!gamePk) {
      if (!away || !home) return res.status(400).json({ error: "need away+home (or gamePk)" });
      try { const g = await resolveGame(away, home, date); gamePk = g.gamePk; awayPid = g.awayPid; homePid = g.homePid; } catch (e) { gamePk = null; }
    }
    if (!gamePk) {
      // No game found for that matchup/date yet — not an error, just nothing to show.
      res.setHeader("Cache-Control", "public, s-maxage=60");
      return res.status(200).json({ posted: false, gamePk: null, away: null, home: null });
    }

    const box = await getJSON(`${SA}/game/${gamePk}/boxscore`);

    // batSide for every listed batter
    const ids = [];
    for (const side of ["away", "home"]) {
      const t = box.teams?.[side];
      for (const pid of (t?.battingOrder || [])) ids.push(pid);
    }
    if (awayPid) ids.push(awayPid);
    if (homePid) ids.push(homePid);
    const people = await peopleMap([...new Set(ids)]);
    const bats = people;
    const tstats = await teamStatsMap();

    const awaySide = extractSide(box, "away", bats);
    const homeSide = extractSide(box, "home", bats);

    const awayId = box.teams?.away?.team?.id;
    const homeId = box.teams?.home?.team?.id;
    awaySide.teamStats = tstats[awayId] || null;
    homeSide.teamStats = tstats[homeId] || null;

    // starter throwing hand (for platoon highlight on the client)
    awaySide.pitcherHand = (awayPid && people[awayPid] && people[awayPid].hand) || "";
    homeSide.pitcherHand = (homePid && people[homePid] && people[homePid].hand) || "";

    const posted = awaySide.posted || homeSide.posted;
    // Lineups can flip from empty->posted quickly near first pitch: cache short until posted, longer after.
    res.setHeader("Cache-Control", posted
      ? "public, s-maxage=120, stale-while-revalidate=300"
      : "public, s-maxage=45");
    return res.status(200).json({ posted, gamePk, away: awaySide, home: homeSide });
  } catch (err) {
    res.status(200).json({ posted: false, gamePk: null, away: null, home: null, error: "lineup_unavailable" });
  }
}