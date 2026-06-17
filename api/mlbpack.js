/**
 * /api/mlbpack.js — Plok MLB scouting pack (DataFeeds / Rolling Insights)
 *
 * Phase 1: season-level. Pulls schedule (probable SPs), team-info (venue/coords),
 * team-stats (batting totals), player-stats (per-player batting/pitching), depth-charts
 * (projected lineup + bullpen), injuries. Computes per-game rates + LEAGUE RANKS, the two
 * probable starters' lines, each side's key hitters, staff/bullpen ERA, and weather
 * (Open-Meteo, no key) for open-air parks. Returns DATA lines for insight.js + the raw pack.
 *
 * ENV: DATAFEEDS_TOKEN  (required)
 *
 * Run-by-game has no game logs (DataFeeds has no game-by-game endpoint) — recent-form / NRFI
 * come in Phase 2 by banking /live/{date} box scores. Everything here is season-to-date.
 *
 * Test:  GET /api/mlbpack?away=Orioles&home=Mariners[&date=YYYY-MM-DD]
 */

const TOKEN = process.env.DATAFEEDS_TOKEN;
const BASE = "http://rest.datafeeds.rolling-insights.com/api/v1";

// ── tiny in-memory cache (league-wide pulls reused across warm invocations) ──
const _cache = new Map(); // key -> { t, v }
const TTL = 30 * 60 * 1000;
async function dfGet(path) {
  const hit = _cache.get(path);
  if (hit && Date.now() - hit.t < TTL) return hit.v;
  const r = await fetch(`${BASE}${path}?RSC_token=${TOKEN}`);
  if (!r.ok) throw new Error(`DataFeeds ${r.status} on ${path}`);
  const j = await r.json();
  const v = (j && j.data && j.data.MLB != null) ? j.data.MLB : j;
  _cache.set(path, { t: Date.now(), v });
  return v;
}

// ── helpers ──
const n = (x) => { const v = parseFloat(x); return Number.isFinite(v) ? v : 0; };
const ipToFloat = (s) => { const p = String(s ?? "0").split("."); const w = n(p[0]); const f = p[1] ? n(p[1]) : 0; return w + f / 3; };
const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;
const fmt3 = (x) => x.toFixed(3).replace(/^0/, ""); // .281
const ord = (i) => { const s = ["th", "st", "nd", "rd"], v = i % 100; return i + (s[(v - 20) % 10] || s[v] || s[0]); };
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

// ── Supabase game-log reads (derived recent-form layer) ──
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
async function sbRows(path) {
  if (!SB_URL || !SB_KEY) return [];
  try { const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbH }); if (!r.ok) return []; const j = await r.json(); return Array.isArray(j) ? j : []; }
  catch { return []; }
}
async function hitterForm(pid) {
  if (pid == null) return null;
  const rows = await sbRows(`mlb_player_logs?player_id=eq.${pid}&bat=not.is.null&order=game_date.desc&limit=20&select=is_home,bat`);
  const games = rows.filter((r) => r.bat && n(r.bat.AB) > 0);
  if (!games.length) return null;
  const last7 = games.slice(0, 7);
  let h = 0, ab = 0, hr = 0, hitG = 0;
  last7.forEach((g) => { h += n(g.bat.H); ab += n(g.bat.AB); hr += n(g.bat.HR); if (n(g.bat.H) > 0) hitG++; });
  let streak = 0; for (const g of games) { if (n(g.bat.H) > 0) streak++; else break; }
  const split = (arr) => { let H = 0, AB = 0; arr.forEach((g) => { H += n(g.bat.H); AB += n(g.bat.AB); }); return AB ? H / AB : null; };
  const homeG = games.filter((g) => g.is_home), awayG = games.filter((g) => !g.is_home);
  return { avg: ab ? h / ab : 0, hr, hitG, of: last7.length, streak,
    homeAvg: split(homeG), awayAvg: split(awayG), homeN: homeG.length, awayN: awayG.length };
}
async function pitcherForm(pid) {
  if (pid == null) return null;
  const rows = await sbRows(`mlb_player_logs?player_id=eq.${pid}&started=eq.true&order=game_date.desc&limit=15&select=inn1_allowed,pit`);
  if (!rows.length) return null;
  const last3 = rows.slice(0, 3);
  let er = 0, ip = 0; last3.forEach((g) => { er += n(g.pit && g.pit.ER); ip += ipToFloat(g.pit && g.pit.IP); });
  const inn1 = rows.filter((g) => g.inn1_allowed != null);
  const clean = inn1.filter((g) => n(g.inn1_allowed) === 0).length;
  return { last3ERA: ip ? r2(9 * er / ip) : null, last3IP: r1(ip), starts: rows.length, nrfiClean: clean, nrfiN: inn1.length };
}
async function teamForm(tid) {
  if (tid == null) return null;
  const rows = await sbRows(`mlb_team_logs?team_id=eq.${tid}&order=game_date.desc&limit=10&select=won,runs_for,runs_against`);
  if (!rows.length) return null;
  const w = rows.filter((r) => r.won).length;
  const rf = rows.reduce((s2, r) => s2 + n(r.runs_for), 0) / rows.length;
  const ra = rows.reduce((s2, r) => s2 + n(r.runs_against), 0) / rows.length;
  return { record: `${w}-${rows.length - w}`, rf: r1(rf), ra: r1(ra), n: rows.length };
}

// Resolve a team object from a free-text side ("Baltimore Orioles", "Orioles", "BAL", "@ Mariners")
function resolveTeam(teams, str) {
  const q = norm(str);
  if (!q) return null;
  let best = null;
  for (const t of teams) {
    const cands = [t.team, t.abbrv, t.mascot, t.city, t.location].map(norm).filter(Boolean);
    for (const c of cands) {
      if (!c) continue;
      if (q === c) return t;                       // exact
      if (q.includes(c) || c.includes(q)) best = best || t; // contains
    }
    // last-word (nickname) match: "... orioles"
    const last = norm(t.team).split(" ").pop();
    if (last && q.split(" ").includes(last)) best = best || t;
  }
  return best;
}

// Build per-team offense + staff/bullpen rates, then league ranks.
function teamRates(teamStats, playerStats, depth, teamInfoById) {
  const offById = {}; // team_id -> { rpg, ops, hr, gp }
  for (const ts of teamStats) {
    const rs = ts.regular_season; if (!rs || !rs.games_played) continue;
    const gp = rs.games_played;
    const singles = n(rs.H) - n(rs["2B"]) - n(rs["3B"]) - n(rs.HR);
    const tb = singles + 2 * n(rs["2B"]) + 3 * n(rs["3B"]) + 4 * n(rs.HR);
    const ab = n(rs.AB), bb = n(rs.BB), h = n(rs.H);
    const obp = (ab + bb) ? (h + bb) / (ab + bb) : 0;
    const slg = ab ? tb / ab : 0;
    offById[ts.team_id] = { rpg: gp ? n(rs.R) / gp : 0, ops: obp + slg, hrpg: gp ? n(rs.HR) / gp : 0, gp };
  }
  // Staff + bullpen ERA aggregated from each team's pitchers (relievers via depth "R" ids).
  const relieverIds = {}; // team_id -> Set(player_id)
  for (const [teamName, groups] of Object.entries(depth || {})) {
    const ti = Object.values(teamInfoById).find((t) => norm(t.team) === norm(teamName));
    if (!ti) continue;
    const set = new Set();
    for (const slot of Object.values(groups.R || {})) if (slot && slot.id != null) set.add(String(slot.id));
    relieverIds[ti.team_id] = set;
  }
  const staff = {}; // team_id -> {er, ip}
  const pen = {};
  for (const p of playerStats) {
    const pit = p.regular_season && p.regular_season.pitching;
    if (!pit) continue;
    const tid = p.team_id; if (tid == null) continue;
    const er = n(pit.ER), ip = ipToFloat(pit.IP);
    staff[tid] = staff[tid] || { er: 0, ip: 0 }; staff[tid].er += er; staff[tid].ip += ip;
    if (relieverIds[tid] && relieverIds[tid].has(String(p.player_id))) {
      pen[tid] = pen[tid] || { er: 0, ip: 0 }; pen[tid].er += er; pen[tid].ip += ip;
    }
  }
  const rates = {};
  for (const ts of teamStats) {
    const tid = ts.team_id;
    const off = offById[tid] || { rpg: 0, ops: 0, hrpg: 0, gp: 0 };
    const st = staff[tid], pn = pen[tid];
    rates[tid] = {
      team_id: tid, team: ts.team,
      record: `${n(ts.regular_season?.wins)}-${n(ts.regular_season?.losses)}`,
      rpg: r2(off.rpg), ops: r3(off.ops), hrpg: r2(off.hrpg),
      staffERA: st && st.ip ? r2(9 * st.er / st.ip) : null,
      penERA: pn && pn.ip ? r2(9 * pn.er / pn.ip) : null,
    };
  }
  // ranks
  const arr = Object.values(rates);
  const rankBy = (key, desc) => {
    const sorted = arr.filter((x) => x[key] != null).sort((a, b) => desc ? b[key] - a[key] : a[key] - b[key]);
    sorted.forEach((x, i) => { x.ranks = x.ranks || {}; x.ranks[key] = i + 1; });
  };
  rankBy("rpg", true);     // most runs = 1st
  rankBy("ops", true);
  rankBy("staffERA", false); // lowest ERA = 1st (best run prevention)
  rankBy("penERA", false);
  return rates;
}

function pitcherLine(playerStats, pid) {
  const p = playerStats.find((x) => String(x.player_id) === String(pid));
  if (!p) return null;
  const pit = p.regular_season && p.regular_season.pitching;
  if (!pit) return { name: p.player, line: "no 2026 stats yet" };
  const ip = ipToFloat(pit.IP);
  const whip = ip ? (n(pit.BB) + n(pit.H)) / ip : 0;
  const k9 = ip ? 9 * n(pit.K) / ip : 0;
  return {
    name: p.player,
    line: `${n(pit.W)}-${n(pit.L)}, ${pit.ERA} ERA, ${r2(whip)} WHIP, ${r1(k9)} K/9 over ${pit.IP} IP`,
  };
}

function hitterLine(p) {
  const b = p.regular_season && p.regular_season.batting;
  if (!b || !b.AB) return null;
  const ab = n(b.AB), h = n(b.H), bb = n(b.BB), hbp = n(b.HBP);
  const singles = h - n(b["2B"]) - n(b["3B"]) - n(b.HR);
  const tb = singles + 2 * n(b["2B"]) + 3 * n(b["3B"]) + 4 * n(b.HR);
  const avg = ab ? h / ab : 0;
  const obp = (ab + bb + hbp) ? (h + bb + hbp) / (ab + bb + hbp) : 0;
  const slg = ab ? tb / ab : 0;
  return { name: p.player, ops: obp + slg, hr: n(b.HR), rbi: n(b.RBI),
    desc: `${fmt3(avg)} AVG, ${n(b.HR)} HR, ${n(b.RBI)} RBI, ${fmt3(obp + slg)} OPS` };
}

// Top hitters for a team: projected lineup (rank "1" at each non-pitching position), by OPS.
function keyHitters(depth, teamName, playerById, hurtIds) {
  const groups = depth[teamName]; if (!groups) return [];
  const ids = new Set();
  for (const [pos, slots] of Object.entries(groups)) {
    if (pos === "S" || pos === "R") continue; // pitchers
    const one = slots && slots["1"];
    if (one && one.id != null) ids.add(String(one.id));
  }
  const out = [];
  for (const id of ids) {
    const p = playerById[id]; if (!p) continue;
    const hl = hitterLine(p); if (!hl) continue;
    hl.id = id;
    hl.out = hurtIds.has(String(id));
    out.push(hl);
  }
  out.sort((a, b) => b.ops - a.ops);
  return out;
}

async function weatherFor(team, gameISO) {
  if (!team || team.dome === 1 || team.dome === "1") return { applies: false, note: "Roof/dome — weather not a factor" };
  if (team.latitude == null || team.longitude == null) return { applies: false, note: "" };
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${team.latitude}&longitude=${team.longitude}` +
      `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation_probability` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=2&timezone=UTC`;
    const r = await fetch(u); if (!r.ok) return { applies: false, note: "" };
    const j = await r.json();
    const times = j.hourly?.time || [];
    const target = gameISO ? Date.parse(gameISO) : Date.now();
    let bi = 0, bd = Infinity;
    times.forEach((t, i) => { const d = Math.abs(Date.parse(t + "Z") - target); if (d < bd) { bd = d; bi = i; } });
    const temp = Math.round(j.hourly.temperature_2m[bi]);
    const wind = Math.round(j.hourly.wind_speed_10m[bi]);
    const dir = j.hourly.wind_direction_10m[bi];
    const rain = j.hourly.precipitation_probability ? j.hourly.precipitation_probability[bi] : null;
    const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(dir / 45) % 8];
    return { applies: true, tempF: temp, windMph: wind, windDir: compass,
      rainPct: rain, note: `${temp}°F, wind ${wind} mph from ${compass}${rain != null ? `, ${rain}% rain` : ""} (open-air)` };
  } catch { return { applies: false, note: "" }; }
}

// ── main builder ──
export async function buildMlbPack(ctx = {}) {
  if (!TOKEN) return null;
  // Resolve the two sides from ctx.game ("Away @ Home") or ctx.away/ctx.home.
  let awayStr = ctx.away, homeStr = ctx.home;
  if ((!awayStr || !homeStr) && ctx.game && /@/.test(ctx.game)) {
    const parts = ctx.game.split(/@/); awayStr = awayStr || parts[0]; homeStr = homeStr || parts[1];
  }
  if (!awayStr || !homeStr) return null;

  const teamInfo = await dfGet(`/team-info/MLB`);
  const away = resolveTeam(teamInfo, awayStr), home = resolveTeam(teamInfo, homeStr);
  if (!away || !home) return null;
  const teamInfoById = {}; teamInfo.forEach((t) => { teamInfoById[t.team_id] = t; });

  const Y = new Date().getFullYear();
  const date = ctx.date || new Date().toISOString().slice(0, 10);
  const [teamStats, playerStats, depth, injuries, sched] = await Promise.all([
    dfGet(`/team-stats/${Y}/MLB`),
    dfGet(`/player-stats/${Y}/MLB`),
    dfGet(`/depth-charts/MLB`),
    dfGet(`/injuries/MLB`),
    dfGet(`/schedule/${date}/MLB`).catch(() => []),
  ]);

  const playerById = {}; playerStats.forEach((p) => { playerById[String(p.player_id)] = p; });

  // Find the scheduled game (today, else tomorrow) for probable starters + first pitch.
  let game = (Array.isArray(sched) ? sched : []).find((g) =>
    (g.away_team_ID === away.team_id && g.home_team_ID === home.team_id) ||
    (g.home_team_ID === away.team_id && g.away_team_ID === home.team_id));
  if (!game) {
    try {
      const tmr = new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10);
      const s2 = await dfGet(`/schedule/${tmr}/MLB`);
      game = (Array.isArray(s2) ? s2 : []).find((g) =>
        (g.away_team_ID === away.team_id && g.home_team_ID === home.team_id) ||
        (g.home_team_ID === away.team_id && g.away_team_ID === home.team_id));
    } catch { /* ignore */ }
  }
  const gameISO = game ? new Date(game.game_time).toISOString() : null;
  const awaySP = game ? (game.away_team_ID === away.team_id ? game.away_pitcher : game.home_pitcher) : null;
  const homeSP = game ? (game.home_team_ID === home.team_id ? game.home_pitcher : game.away_pitcher) : null;

  // Injuries -> ONE "actually out" set (excludes Probable / day-to-day-back) used for
  // both the hitter INJURED flag and the injuries line, so they never disagree.
  const isOut = (rt) => /out until at least/i.test(rt || "") || (/\bout\b/i.test(rt || "") && !/probable/i.test(rt || ""));
  const outByTeam = {}; const outIds = new Set();
  (Array.isArray(injuries) ? injuries : []).forEach((row) => {
    const outs = (row.injuries || []).filter((i) => isOut(i.returns));
    outByTeam[row.team_id] = outs;
    outs.forEach((i) => outIds.add(String(i.player_id)));
  });

  const rates = teamRates(teamStats, playerStats, depth, teamInfoById);
  const aR = rates[away.team_id] || {}, hR = rates[home.team_id] || {};

  const aHit = keyHitters(depth, away.team, playerById, outIds).slice(0, 3);
  const hHit = keyHitters(depth, home.team, playerById, outIds).slice(0, 3);
  const aSP = awaySP ? pitcherLine(playerStats, awaySP.player_id) : null;
  const hSP = homeSP ? pitcherLine(playerStats, homeSP.player_id) : null;
  const weather = await weatherFor(home, gameISO);

  const keyInjStr = (tid) => (outByTeam[tid] || []).slice(0, 4).map((i) => `${i.player} (${i.injury})`).join(", ");

  // ── DATA lines for insight.js (label/value) ──
  const rk = (r) => (r ? ` (${ord(r)})` : "");
  const lines = [];
  lines.push({ label: `${away.team} record`, value: aR.record || "—" });
  lines.push({ label: `${home.team} record`, value: hR.record || "—" });
  if (aR.rpg != null) lines.push({ label: `${away.abbrv} runs/game`, value: `${aR.rpg}${rk(aR.ranks?.rpg)}` });
  if (hR.rpg != null) lines.push({ label: `${home.abbrv} runs/game`, value: `${hR.rpg}${rk(hR.ranks?.rpg)}` });
  if (aR.ops != null) lines.push({ label: `${away.abbrv} team OPS`, value: `${fmt3(aR.ops)}${rk(aR.ranks?.ops)}` });
  if (hR.ops != null) lines.push({ label: `${home.abbrv} team OPS`, value: `${fmt3(hR.ops)}${rk(hR.ranks?.ops)}` });
  if (aR.staffERA != null) lines.push({ label: `${away.abbrv} staff ERA`, value: `${aR.staffERA}${rk(aR.ranks?.staffERA)}` });
  if (hR.staffERA != null) lines.push({ label: `${home.abbrv} staff ERA`, value: `${hR.staffERA}${rk(hR.ranks?.staffERA)}` });
  if (aR.penERA != null) lines.push({ label: `${away.abbrv} bullpen ERA`, value: `${aR.penERA}${rk(aR.ranks?.penERA)}` });
  if (hR.penERA != null) lines.push({ label: `${home.abbrv} bullpen ERA`, value: `${hR.penERA}${rk(hR.ranks?.penERA)}` });
  if (aSP) lines.push({ label: `Probable SP — ${away.abbrv}`, value: `${aSP.name}: ${aSP.line}` });
  if (hSP) lines.push({ label: `Probable SP — ${home.abbrv}`, value: `${hSP.name}: ${hSP.line}` });
  aHit.forEach((h) => lines.push({ label: `${away.abbrv} bat — ${h.name}${h.out ? " (INJURED)" : ""}`, value: h.desc }));
  hHit.forEach((h) => lines.push({ label: `${home.abbrv} bat — ${h.name}${h.out ? " (INJURED)" : ""}`, value: h.desc }));
  const aInj = keyInjStr(away.team_id), hInj = keyInjStr(home.team_id);
  if (aInj) lines.push({ label: `${away.abbrv} injuries`, value: aInj });
  if (hInj) lines.push({ label: `${home.abbrv} injuries`, value: hInj });
  lines.push({ label: "Weather", value: weather.note || "n/a" });

  // ── derived recent-form layer (from banked game logs; silently skipped if empty) ──
  const [aTF, hTF, aPF, hPF, aH0, aH1, hH0, hH1] = await Promise.all([
    teamForm(away.team_id), teamForm(home.team_id),
    pitcherForm(awaySP && awaySP.player_id), pitcherForm(homeSP && homeSP.player_id),
    hitterForm(aHit[0] && aHit[0].id), hitterForm(aHit[1] && aHit[1].id),
    hitterForm(hHit[0] && hHit[0].id), hitterForm(hHit[1] && hHit[1].id),
  ]);
  const haveLogs = !!(aTF || hTF || aPF || hPF || aH0 || hH0);
  const splitStr = (f) => (f.homeN >= 3 && f.awayN >= 3 && f.homeAvg != null && f.awayAvg != null)
    ? ` · home ${fmt3(f.homeAvg)} / away ${fmt3(f.awayAvg)}` : "";
  const pushHForm = (label, f) => { if (!f) return; lines.push({ label,
    value: `${fmt3(f.avg)} over last ${f.of}, ${f.hr} HR, hit in ${f.hitG} of ${f.of}` +
      (f.streak > 1 ? `, ${f.streak}-game hit streak` : "") + splitStr(f) }); };
  if (aTF) lines.push({ label: `${away.abbrv} last 10`, value: `${aTF.record} · ${aTF.rf} RF / ${aTF.ra} RA` });
  if (hTF) lines.push({ label: `${home.abbrv} last 10`, value: `${hTF.record} · ${hTF.rf} RF / ${hTF.ra} RA` });
  if (aPF && aSP) lines.push({ label: `${away.abbrv} SP recent`, value: `${aSP.name}: last ${Math.min(aPF.starts,3)} starts ${aPF.last3ERA != null ? aPF.last3ERA + " ERA" : "—"}` + (aPF.nrfiN ? ` · scoreless 1st in ${aPF.nrfiClean} of ${aPF.nrfiN} starts` : "") });
  if (hPF && hSP) lines.push({ label: `${home.abbrv} SP recent`, value: `${hSP.name}: last ${Math.min(hPF.starts,3)} starts ${hPF.last3ERA != null ? hPF.last3ERA + " ERA" : "—"}` + (hPF.nrfiN ? ` · scoreless 1st in ${hPF.nrfiClean} of ${hPF.nrfiN} starts` : "") });
  if (aHit[0]) pushHForm(`${away.abbrv} form — ${aHit[0].name}`, aH0);
  if (aHit[1]) pushHForm(`${away.abbrv} form — ${aHit[1].name}`, aH1);
  if (hHit[0]) pushHForm(`${home.abbrv} form — ${hHit[0].name}`, hH0);
  if (hHit[1]) pushHForm(`${home.abbrv} form — ${hHit[1].name}`, hH1);

  const note = `${away.team} @ ${home.team}` + (gameISO ? ` — first pitch ${new Date(gameISO).toUTCString()}` : "") +
    ` at ${home.arena}. Season figures are 2026-to-date` +
    (haveLogs ? "; recent-form / splits / NRFI are from the last ~3 weeks of game logs." : "; recent-form not yet banked (run the backfill).");

  return {
    lines, note, matchup: true,
    pack: { away: away.team, home: home.team, gameISO, rates: { away: aR, home: hR },
      starters: { away: aSP, home: hSP }, hitters: { away: aHit, home: hHit }, weather,
      injuries: { away: aInj, home: hInj },
      form: { teamAway: aTF, teamHome: hTF, spAway: aPF, spHome: hPF } },
  };
}

// ── test handler ──
export default async function handler(req, res) {
  try {
    if (!TOKEN) return res.status(500).json({ error: "DATAFEEDS_TOKEN not set" });
    const q = req.query || {};
    const out = await buildMlbPack({ away: q.away, home: q.home, game: q.game, date: q.date });
    if (!out) return res.status(404).json({ error: "Could not resolve game. Pass ?away=&home= (team name or abbr)." });
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}