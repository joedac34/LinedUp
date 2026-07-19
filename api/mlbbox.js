/**
 * /api/mlbbox.js — top performers for one game's gamecast.
 *
 *   GET /api/mlbbox?gamePk=824981
 *   -> { gamePk, hitters:[{team,abbr,name,line}], pitchers:[{team,abbr,name,line}] }
 *
 * WHY A SEPARATE ENDPOINT:
 *   /api/livescores already carries everything the gamecast needs for the LIVE half —
 *   inning, outs, bases, at-bat, pitching, decisions — because the schedule hydrate
 *   returns it and the mapper now keeps it. The ONLY thing it can't give us is per-player
 *   box lines. So this is one small call, made when a gamecast SHEET OPENS, never for the
 *   score chips in a list.
 *
 * WHY NOT feed/live:
 *   Probed 17 Jul 2026 on a live game: 0.77 MB / 74 plays. A completed game runs 250-300
 *   plays, so 2-3 MB. That is not something to download because someone tapped a row.
 *   /boxscore is a fraction of it and has every field we use.
 *
 * Field names below are from that probe, not from memory:
 *   stats.batting  -> hits, atBats, rbi, homeRuns, doubles, triples, stolenBases
 *   stats.pitching -> inningsPitched (STRING, e.g. "6.1"), strikeOuts, earnedRuns,
 *                     numberOfPitches, wins, losses
 *   seasonStats.batting.avg / seasonStats.pitching.era  (both strings, e.g. ".193")
 *
 * Free, keyless, no Odds API usage.
 */

const BOX = (pk) => `https://statsapi.mlb.com/api/v1/game/${pk}/boxscore`;

const cache = new Map(); // gamePk -> { at, data }
const TTL_LIVE = 30_000; // a live box changes constantly
const TTL_DONE = 6 * 60 * 60 * 1000; // a final box never changes

const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

/** "6.1" innings means 6 and 1/3, not 6.1 — sorting on the raw string/float is wrong. */
function ipToOuts(ip) {
  const s = String(ip == null ? "" : ip);
  if (!s) return 0;
  const [whole, frac] = s.split(".");
  return n(whole) * 3 + n(frac || 0);
}

function batLine(b) {
  if (!b) return "";
  const bits = [`${n(b.hits)}-${n(b.atBats)}`];
  if (n(b.homeRuns) > 0) bits.push(n(b.homeRuns) === 1 ? "HR" : `${b.homeRuns} HR`);
  else if (n(b.doubles) > 0) bits.push("2B");
  else if (n(b.triples) > 0) bits.push("3B");
  if (n(b.rbi) > 0) bits.push(`${b.rbi} RBI`);
  if (n(b.stolenBases) > 0) bits.push(`${b.stolenBases} SB`);
  return bits.join(", ");
}

function pitchLine(p) {
  if (!p) return "";
  const bits = [`${p.inningsPitched ?? "0.0"} IP`];
  if (n(p.strikeOuts) > 0) bits.push(`${p.strikeOuts} K`);
  bits.push(`${n(p.earnedRuns)} ER`);
  return bits.join(", ");
}

/** How good was this hitter's day? Only used for ranking, never shown. */
function batScore(b) {
  return n(b.hits) * 2 + n(b.homeRuns) * 4 + n(b.rbi) * 2 + n(b.doubles) + n(b.triples) * 2 + n(b.stolenBases);
}

function collect(sideKey, side, out) {
  const abbr = side?.team?.abbreviation || "";
  const team = side?.team?.name || "";
  Object.values(side?.players || {}).forEach((p) => {
    const nm = p?.person?.fullName;
    if (!nm) return;
    const b = p.stats?.batting;
    // A player with an empty batting object hasn't hit — the probe showed batting:{} for
    // anyone who hasn't come up, so check for a real plate appearance, not for the key.
    if (b && (n(b.atBats) > 0 || n(b.baseOnBalls) > 0)) {
      out.hitters.push({
        side: sideKey, team, abbr, name: nm,
        line: batLine(b),
        avg: p.seasonStats?.batting?.avg || null,
        _rank: batScore(b),
      });
    }
    const q = p.stats?.pitching;
    if (q && ipToOuts(q.inningsPitched) > 0) {
      out.pitchers.push({
        side: sideKey, team, abbr, name: nm,
        line: pitchLine(q),
        era: p.seasonStats?.pitching?.era || null,
        _rank: ipToOuts(q.inningsPitched),
      });
    }
  });
}

export default async function handler(req, res) {
  const gamePk = req.query.gamePk || req.query.pk;
  if (!gamePk) return res.status(400).json({ error: "gamePk required" });

  const hit = cache.get(String(gamePk));
  if (hit && Date.now() - hit.at < (hit.data.final ? TTL_DONE : TTL_LIVE)) {
    return res.status(200).json({ ...hit.data, cached: true });
  }

  try {
    const r = await fetch(BOX(gamePk), { headers: { "User-Agent": "PickLock/1.0" } });
    if (!r.ok) return res.status(200).json({ gamePk, hitters: [], pitchers: [], error: `upstream ${r.status}` });
    const bx = await r.json();

    const out = { gamePk: Number(gamePk), hitters: [], pitchers: [], pitcherLines: {} };
    collect("away", bx.teams?.away, out);
    collect("home", bx.teams?.home, out);

    // Top 2 bats and top 2 arms is what the gamecast shows. Ranking fields never ship.
    out.hitters.sort((a, b) => b._rank - a._rank);
    out.pitchers.sort((a, b) => b._rank - a._rank);
    // EVERY pitcher's line, keyed by name, BEFORE the top-2 slice — the gamecast's
    // WIN/LOSS pills need the decision pitchers' stats and those are often not the
    // top-2 by innings (a closer takes the W, a reliever takes the L). ~10 tiny
    // strings per game.
    out.pitchers.forEach((p) => { if (p.name && p.line) out.pitcherLines[p.name] = p.line; });
    out.hitters = out.hitters.slice(0, 2).map(({ _rank, ...x }) => x);
    out.pitchers = out.pitchers.slice(0, 2).map(({ _rank, ...x }) => x);
    out.final = !!(bx.teams?.away?.teamStats?.batting?.atBats && bx.info?.length);

    cache.set(String(gamePk), { at: Date.now(), data: out });
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=300");
    return res.status(200).json(out);
  } catch (e) {
    // Never break the sheet over a box score — the gamecast renders fine without it.
    return res.status(200).json({ gamePk: Number(gamePk), hitters: [], pitchers: [], error: String(e.message || e) });
  }
}