/**
 * /api/plokcalls.js — "Plok's Call" daily notifications.
 *
 * Scans the day's slate for the highest objective +EV plays (reusing findbet's de-vig
 * consensus math), then drops the top picks into each Pro user's notification center as
 * type "plok_call". This is Plok reaching out proactively instead of waiting to be asked.
 *
 * Query params (cron uses defaults): ?sports=mlb  ?min=2.5  ?top=2  ?dry=1 (preview, no insert)
 *
 * ENV: ODDS_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
 * Reuses: analyzeGame + SPORT_KEYS from ./findbet.js (single source for the odds math).
 */
import { analyzeGame, analyzeProps, SPORT_KEYS } from "./findbet.js";

export const maxDuration = 60;

const ODDS = process.env.ODDS_API_KEY;
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function sbGet(path) {
  try { const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbH }); if (!r.ok) return []; const j = await r.json(); return Array.isArray(j) ? j : []; }
  catch { return []; }
}
async function sbInsert(rows) {
  let done = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const r = await fetch(`${SB_URL}/rest/v1/notifications`, { method: "POST", headers: { ...sbH, Prefer: "return=minimal" }, body: JSON.stringify(chunk) });
    if (!r.ok) throw new Error(`notifications insert ${r.status}: ${(await r.text()).slice(0, 200)}`);
    done += chunk.length;
  }
  return done;
}

const betTypeFor = (m) => (m === "h2h" ? "ml" : m === "spreads" ? "spread" : m === "totals" ? "ou" : m);

export default async function handler(req, res) {
  if (!ODDS || !SB_URL || !SB_KEY) return res.status(500).json({ error: "Missing env (ODDS_API_KEY / VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY)" });
  const q = req.query || {};
  const sports = String(q.sports || "mlb").split(",").map((s) => s.trim()).filter((s) => SPORT_KEYS[s]);
  const minEv = Number.isFinite(parseFloat(q.min)) ? parseFloat(q.min) : 2.5;
  const top = Math.min(Math.max(parseInt(q.top || "2", 10) || 2, 1), 5);
  const propGames = Math.min(Math.max(parseInt(q.propgames || "8", 10) || 8, 0), 20);
  const dry = q.dry === "1" || q.dry === "true";

  // 1) Scan each sport's slate for +EV on not-yet-started games: game lines (1 bulk
  //    call) + player props (one per-event call each, capped at propGames to bound cost).
  const now = Date.now();
  const horizon = now + 30 * 3600 * 1000; // next ~30h
  const cands = [];
  for (const sport of sports) {
    try {
      const url = `https://api.the-odds-api.com/v4/sports/${SPORT_KEYS[sport]}/odds?apiKey=${ODDS}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
      const r = await fetch(url); if (!r.ok) continue;
      const events = await r.json();
      const upcoming = (Array.isArray(events) ? events : []).filter((ev) => {
        const start = ev.commence_time ? Date.parse(ev.commence_time) : null;
        return !start || (start >= now && start <= horizon);
      }).sort((a, b) => Date.parse(a.commence_time || 0) - Date.parse(b.commence_time || 0));
      // game lines (cheap: already in the bulk payload)
      for (const ev of upcoming) {
        const game = `${ev.away_team} @ ${ev.home_team}`;
        for (const c of analyzeGame(ev)) {
          if (c.suspicious || c.evPct < minEv || c.books < 4) continue;
          cands.push({ ...c, sport, game, commence_time: ev.commence_time || null, betType: betTypeFor(c.market) });
        }
      }
      // player props (softer markets = more real edges; one odds call per game, capped)
      for (const ev of upcoming.slice(0, propGames)) {
        const game = `${ev.away_team} @ ${ev.home_team}`;
        let props = [];
        try { props = await analyzeProps(sport, ev.id); } catch (e) { props = []; }
        for (const c of (props || [])) {
          if (c.suspicious || c.evPct < minEv || c.books < 3) continue;
          cands.push({ ...c, sport, game, commence_time: ev.commence_time || null, betType: "prop" });
        }
      }
    } catch (e) { /* skip sport on error */ }
  }
  cands.sort((a, b) => b.evPct - a.evPct);
  const picks = cands.slice(0, top);
  if (!picks.length) return res.status(200).json({ ok: true, sportsScanned: sports, candidates: cands.length, calls: 0 });

  if (dry) return res.status(200).json({ ok: true, dry: true, sportsScanned: sports, candidates: cands.length, picks });

  // 2) Eligible users: Pro with Plok's Calls not disabled.
  const users = await sbGet(`users?select=id,notif_plok&is_pro=eq.true`);
  const recipients = users.filter((u) => u.notif_plok !== false).map((u) => u.id);
  if (!recipients.length) return res.status(200).json({ ok: true, calls: picks.length, usersNotified: 0, note: "no eligible Pro users" });

  // 3) Dedupe: don't re-notify a (user, pick) already sent in the last 3 days.
  const since = new Date(now - 3 * 86400 * 1000).toISOString();
  const recent = await sbGet(`notifications?type=eq.plok_call&created_at=gte.${since}&select=user_id,data`);
  const sent = new Set(recent.map((n) => `${n.user_id}|${n.data && n.data.selkey}`));

  // 4) Build + insert.
  const nowIso = new Date().toISOString();
  const rows = [];
  for (const p of picks) {
    const selkey = `${p.sport}|${p.game}|${p.label}`;
    const body = `${p.game}: ${p.label} at ${p.bestOdds} — +${p.evPct}% edge (fair ${p.fairPct}%, ${p.bestBook})`;
    const data = { selkey, selection: p.label, game: p.game, sport: p.sport, betType: p.betType, market: p.market, evPct: p.evPct, fairPct: p.fairPct, bestOdds: p.bestOdds, bestBook: p.bestBook, commence_time: p.commence_time };
    for (const uid of recipients) {
      if (sent.has(`${uid}|${selkey}`)) continue;
      rows.push({ user_id: uid, type: "plok_call", title: "Plok's Call", body, data, read_at: null, created_at: nowIso });
    }
  }
  let inserted = 0;
  try { inserted = rows.length ? await sbInsert(rows) : 0; }
  catch (e) { return res.status(500).json({ error: String(e.message || e), calls: picks.length, prepared: rows.length }); }

  return res.status(200).json({ ok: true, sportsScanned: sports, candidates: cands.length, calls: picks.length, usersEligible: recipients.length, inserted, picks: picks.map((p) => ({ sport: p.sport, game: p.game, label: p.label, evPct: p.evPct, bestOdds: p.bestOdds })) });
}