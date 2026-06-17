/**
 * /api/mlbprop.js — Plok MLB player-prop pack.
 *
 * Resolves the player, reads their banked game logs (mlb_player_logs) for the specific
 * stat, and computes last-5/10/15 per-game values, average, hit-rate vs the line, and a
 * home/away split — plus season context (slash line for hitters; ERA / WHIP / K9 and
 * last-5-starts ERA for pitchers) from DataFeeds /player-stats.
 *
 * Supported counting props: hits, total bases, HR, RBIs, runs, stolen bases, walks,
 * batter strikeouts, singles/doubles/triples, H+R+RBI; pitcher K, earned runs,
 * hits allowed, walks allowed, outs. SLG/OPS/ERA shown as context. WAR is NOT in the
 * feed and is never fabricated.
 *
 * ENV: DATAFEEDS_TOKEN, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const TOKEN = process.env.DATAFEEDS_TOKEN;
const BASE = "http://rest.datafeeds.rolling-insights.com/api/v1";
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

const _c = new Map(); const TTL = 30 * 60 * 1000;
async function dfGet(path) {
  const h = _c.get(path); if (h && Date.now() - h.t < TTL) return h.v;
  const r = await fetch(`${BASE}${path}?RSC_token=${TOKEN}`);
  if (!r.ok) throw new Error(`DataFeeds ${r.status}`);
  const j = await r.json(); const v = (j && j.data && j.data.MLB != null) ? j.data.MLB : j;
  _c.set(path, { t: Date.now(), v }); return v;
}
async function sbRows(path) {
  if (!SB_URL || !SB_KEY) return [];
  try { const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbH }); if (!r.ok) return []; const j = await r.json(); return Array.isArray(j) ? j : []; }
  catch { return []; }
}

const n = (x) => { const v = parseFloat(x); return Number.isFinite(v) ? v : 0; };
const ipToFloat = (s) => { const p = String(s == null ? "0" : s).split("."); const w = n(p[0]); const f = p[1] ? n(p[1]) : 0; return w + f / 3; };
const norm = (s) => String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
const tb = (b) => (b ? n(b["1B"]) + 2 * n(b["2B"]) + 3 * n(b["3B"]) + 4 * n(b.HR) : 0);
const fmt3 = (x) => x.toFixed(3).replace(/^0/, "");
const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

function resolvePlayer(players, name) {
  const q = norm(name); if (!q) return null;
  let best = null;
  for (const p of players) { const pn = norm(p.player); if (!pn) continue; if (pn === q) return p; if (pn.includes(q) || q.includes(pn)) best = best || p; }
  if (!best) { const last = q.split(" ").pop(); for (const p of players) { if (norm(p.player).split(" ").pop() === last) { best = p; break; } } }
  return best;
}

// stat text/market-key -> { kind, label, f(logRow), sf(seasonBlock), perStart }
function statResolver(text, playerIsPitcher) {
  const t = String(text == null ? "" : text).toLowerCase().replace(/_/g, " ");
  const hintPit = /pitcher/.test(t), hintBat = /batter|hitter/.test(t);
  const isPit = hintPit || (!hintBat && playerIsPitcher);
  if (/earned run/.test(t)) return { kind: "pit", label: "Earned runs", f: (r) => n(r.pit && r.pit.ER), sf: (b) => n(b.ER), perStart: true };
  if (/hits?\s*allowed/.test(t)) return { kind: "pit", label: "Hits allowed", f: (r) => n(r.pit && r.pit.H), sf: (b) => n(b.H), perStart: true };
  if (/walks?\s*allowed/.test(t)) return { kind: "pit", label: "Walks allowed", f: (r) => n(r.pit && r.pit.BB), sf: (b) => n(b.BB), perStart: true };
  if (/\bouts?\b/.test(t) && isPit) return { kind: "pit", label: "Outs", f: (r) => Math.round(ipToFloat(r.pit && r.pit.IP) * 3), sf: (b) => Math.round(ipToFloat(b.IP) * 3), perStart: true };
  if (/strikeout|punch|\bks?\b/.test(t))
    return isPit ? { kind: "pit", label: "Strikeouts (K)", f: (r) => n(r.pit && r.pit.K), sf: (b) => n(b.K), perStart: true }
                 : { kind: "bat", label: "Strikeouts", f: (r) => n(r.bat && r.bat.SO), sf: (b) => n(b.SO) };
  if (/total\s*bases?/.test(t)) return { kind: "bat", label: "Total bases", f: (r) => tb(r.bat), sf: (b) => tb(b) };
  if (/home\s*runs?|\bhr\b/.test(t)) return { kind: "bat", label: "Home runs", f: (r) => n(r.bat && r.bat.HR), sf: (b) => n(b.HR) };
  if (/hits?\s*\+\s*runs?\s*\+\s*rbi|h\s*\+\s*r\s*\+\s*rbi|hrr/.test(t)) return { kind: "bat", label: "Hits+Runs+RBIs", f: (r) => n(r.bat && r.bat.H) + n(r.bat && r.bat.R) + n(r.bat && r.bat.RBI), sf: (b) => n(b.H) + n(b.R) + n(b.RBI) };
  if (/rbi|runs?\s*batted/.test(t)) return { kind: "bat", label: "RBIs", f: (r) => n(r.bat && r.bat.RBI), sf: (b) => n(b.RBI) };
  if (/runs?\s*scored|\bruns?\b/.test(t)) return { kind: "bat", label: "Runs", f: (r) => n(r.bat && r.bat.R), sf: (b) => n(b.R) };
  if (/stolen\s*base|steals?/.test(t)) return { kind: "bat", label: "Stolen bases", f: (r) => n(r.bat && r.bat.SB), sf: (b) => n(b.SB) };
  if (/walks?|bases?\s*on\s*balls|\bbb\b/.test(t)) return { kind: "bat", label: "Walks", f: (r) => n(r.bat && r.bat.BB), sf: (b) => n(b.BB) };
  if (/singles?\b/.test(t)) return { kind: "bat", label: "Singles", f: (r) => n(r.bat && r.bat["1B"]), sf: (b) => n(b["1B"]) };
  if (/doubles?\b/.test(t)) return { kind: "bat", label: "Doubles", f: (r) => n(r.bat && r.bat["2B"]), sf: (b) => n(b["2B"]) };
  if (/triples?\b/.test(t)) return { kind: "bat", label: "Triples", f: (r) => n(r.bat && r.bat["3B"]), sf: (b) => n(b["3B"]) };
  if (/hits?\b/.test(t)) return { kind: "bat", label: "Hits", f: (r) => n(r.bat && r.bat.H), sf: (b) => n(b.H) };
  return null;
}

function batterContext(b, gp) {
  if (!b || !b.AB) return null;
  const ab = n(b.AB), h = n(b.H), bb = n(b.BB), hbp = n(b.HBP);
  const avgv = ab ? h / ab : 0;
  const obp = (ab + bb + hbp) ? (h + bb + hbp) / (ab + bb + hbp) : 0;
  const slg = ab ? tb(b) / ab : 0;
  return `${fmt3(avgv)}/${fmt3(obp)}/${fmt3(slg)} slash, ${fmt3(obp + slg)} OPS, ${n(b.HR)} HR, ${n(b.RBI)} RBI in ${gp} G`;
}
function pitcherContext(p, gp) {
  if (!p) return null;
  const ip = ipToFloat(p.IP);
  const whip = ip ? (n(p.BB) + n(p.H)) / ip : 0;
  const k9 = ip ? 9 * n(p.K) / ip : 0;
  return `${n(p.W)}-${n(p.L)}, ${p.ERA} ERA, ${(Math.round(whip * 100) / 100)} WHIP, ${(Math.round(k9 * 10) / 10)} K/9 in ${gp} G`;
}

export async function buildMlbProp(ctx, prop) {
  if (!TOKEN || !prop || !prop.player) return null;
  const Y = new Date().getFullYear();
  const players = await dfGet(`/player-stats/${Y}/MLB`);
  const ps = resolvePlayer(players, prop.player);
  if (!ps) return null;
  const rs = ps.regular_season || {};
  const playerIsPitcher = ["P", "S", "R"].includes(ps.position_category) || ps.position === "P";

  const statText = [prop.stat, ctx.market, ctx.selection].find((x) => typeof x === "string" && x.trim()) || "";
  const stat = statResolver(statText, playerIsPitcher);
  const line = prop.line != null ? prop.line : (ctx.line != null ? n(ctx.line) : null);
  const seasonBlock = (rs && (rs.pitching || rs.batting)) || null;
  const gp = n(rs.games_played);

  // unsupported stat (e.g., WAR): return honest context only, no fabricated line.
  if (!stat) {
    const lines = [];
    const ctxStr = playerIsPitcher ? pitcherContext(rs.pitching, gp) : batterContext(rs.batting, gp);
    if (ctxStr) lines.push({ label: "2026 season", value: ctxStr });
    return { lines, note: `${ps.player}: "${statText || "that stat"}" isn't available in this data feed${/war/i.test(statText) ? " (WAR can't be derived from box scores)" : ""}. Read from the season line and overall form; do not state a number for it.` };
  }

  const col = stat.kind === "pit" ? "pit" : "bat";
  let q = `mlb_player_logs?player_id=eq.${ps.player_id}&${col}=not.is.null&order=game_date.desc&limit=20&select=game_date,is_home,${col}`;
  if (stat.kind === "pit" && stat.perStart) q += "&started=eq.true";
  const rows = await sbRows(q);

  const lines = [];
  const overUnder = line != null ? ` o/u ${line}` : "";
  const unit = stat.kind === "pit" ? "start" : "game";

  if (rows.length) {
    const vals = rows.map(stat.f);
    const last5 = vals.slice(0, 5), last10 = vals.slice(0, 10);
    lines.push({ label: `Last 10 ${stat.label.toLowerCase()}/${unit}`, value: avg(last10).toFixed(2) });
    if (line != null) {
      const o10 = last10.filter((v) => v > line).length;
      lines.push({ label: `Over ${line}`, value: `${o10} of last ${last10.length} (${pctOf(o10, last10.length)}%)` });
    }
    lines.push({ label: `Last 5`, value: last5.join(", ") || "—" });
    if (seasonBlock && gp) {
      const seasonTot = stat.sf(seasonBlock);
      lines.push({ label: `Season/${unit}`, value: `${(seasonTot / gp).toFixed(2)} (${seasonTot} in ${gp})` });
    }
    // home/away split for this stat
    const homeV = rows.filter((r) => r.is_home).map(stat.f), awayV = rows.filter((r) => !r.is_home).map(stat.f);
    if (homeV.length >= 3 && awayV.length >= 3) lines.push({ label: `Home / Away`, value: `${avg(homeV).toFixed(2)} / ${avg(awayV).toFixed(2)} per ${unit}` });
    if (line != null) {
      const o5 = last5.filter((v) => v > line).length;
      lines.push({ label: `Last 5 over ${line}`, value: `${o5} of ${last5.length}` });
    }
  }

  // season context line + last-5-starts ERA for pitchers
  if (stat.kind === "pit" && rs.pitching) {
    const pc = pitcherContext(rs.pitching, gp); if (pc) lines.push({ label: "2026 season", value: pc });
    const starts = await sbRows(`mlb_player_logs?player_id=eq.${ps.player_id}&started=eq.true&order=game_date.desc&limit=5&select=pit`);
    if (starts.length) {
      let er = 0, ip = 0; starts.forEach((g) => { er += n(g.pit && g.pit.ER); ip += ipToFloat(g.pit && g.pit.IP); });
      if (ip) lines.push({ label: `Last ${starts.length} starts ERA`, value: (Math.round((9 * er / ip) * 100) / 100).toFixed(2) });
    }
  } else if (rs.batting) {
    const bc = batterContext(rs.batting, gp); if (bc) lines.push({ label: "2026 season", value: bc });
  }

  if (!lines.length) return null;
  const note = `${ps.player} — ${stat.label}${overUnder}. Per-${unit} values are from banked game logs (last ~3 weeks); season line via DataFeeds. Lead with the hit-rate vs the line and the recent trend; never invent a number not shown.`;
  return { lines, note };
}

// ── test handler:  /api/mlbprop?player=Aaron%20Judge&stat=total_bases&line=1.5 ──
export default async function handler(req, res) {
  try {
    if (!TOKEN) return res.status(500).json({ error: "DATAFEEDS_TOKEN not set" });
    const q = req.query || {};
    const prop = { player: q.player, stat: q.stat || q.market || "", line: q.line != null ? Number(q.line) : null };
    const out = await buildMlbProp({ market: q.market, selection: q.player, line: prop.line }, prop);
    if (!out) return res.status(404).json({ error: "No data. Pass ?player=&stat=&line= (e.g. stat=hits or pitcher_strikeouts)." });
    return res.status(200).json(out);
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}