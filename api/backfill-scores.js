/**
 * /api/backfill-scores.js  —  ONE-OFF (delete after running)
 *
 * Fills home_score / away_score / final_status on already-graded picks (result W/L)
 * that don't have scores yet. Historical finals come from ESPN's scoreboard queried
 * by the pick's own date (grade.js's live scoreboard only looks back ~3 days), and
 * are matched to each pick with the same teams + game_date logic grade.js uses.
 *
 * No Odds API usage. Idempotent: only touches picks where home_score IS NULL.
 *
 * Run (PowerShell):
 *   $h=@{ Authorization = "Bearer <CRON_SECRET>" }
 *   # preview only, writes nothing:
 *   Invoke-RestMethod -Uri "https://lined-up-murex.vercel.app/api/backfill-scores?dry=1" -Headers $h
 *   # do it:
 *   Invoke-RestMethod -Uri "https://lined-up-murex.vercel.app/api/backfill-scores" -Headers $h
 *
 * Optional query params: ?sport=mlb (default), ?dry=1 (preview), ?limit=5000 (safety cap).
 */

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

// ESPN league map (add sports here if you expand beyond MLB).
const ESPN_MAP = {
  mlb: { sp: "baseball", lg: "mlb" },
  nba: { sp: "basketball", lg: "nba" },
  nfl: { sp: "football", lg: "nfl" },
};

async function sbGet(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders });
  if (!r.ok) throw new Error(`sbGet ${r.status}: ${await r.text()}`);
  return r.json();
}
async function sbPatch(path, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { method: "PATCH", headers: sbHeaders, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`sbPatch ${r.status}: ${await r.text()}`);
}

// ── same normalization / matching as grade.js gameScoreFor ────────────────────
function normName(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}
function parseMatchupTeams(g) {
  const s = (g || "").trim();
  if (!s.includes("@")) return null;
  const parts = s.split("@").map(x => x.trim()).filter(Boolean);
  return parts.length === 2 ? parts : null;
}
const lastWord = (x) => { const n = normName(x || ""); const p = n.split(" "); return p[p.length - 1]; };
const sameTeam = (a, b) => { const na = normName(a || ""), nb = normName(b || ""); if (!na || !nb) return false; return na.includes(nb) || nb.includes(na) || lastWord(a) === lastWord(b); };
const bothTeams = (teams, g) =>
  (sameTeam(teams[0], g.home_team) || sameTeam(teams[0], g.away_team)) &&
  (sameTeam(teams[1], g.home_team) || sameTeam(teams[1], g.away_team));

const ymdUTC = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

async function fetchESPNday(em, day, pool, seen) {
  try {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${em.sp}/${em.lg}/scoreboard?dates=${day}`);
    if (!r.ok) return;
    const data = await r.json();
    for (const e of (data.events || [])) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      const comp = e.competitions && e.competitions[0];
      if (!comp) continue;
      const cs = comp.competitors || [];
      const home = cs.find(c => c.homeAway === "home");
      const away = cs.find(c => c.homeAway === "away");
      if (!home || !away) continue;
      const st = (e.status && e.status.type) || {};
      const hn = (home.team && (home.team.displayName || home.team.name)) || "";
      const an = (away.team && (away.team.displayName || away.team.name)) || "";
      pool.push({
        home_team: hn, away_team: an,
        home_score: parseFloat(home.score), away_score: parseFloat(away.score),
        completed: !!st.completed, date: e.date || null,
      });
    }
  } catch (e) { /* skip this day */ }
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: "Missing Supabase env" });

  const dry = req.query?.dry === "1" || req.query?.dry === "true";
  const sport = (req.query?.sport || "mlb").toLowerCase();
  const em = ESPN_MAP[sport];
  if (!em) return res.status(400).json({ error: `Unknown sport '${sport}'` });
  const hardCap = Math.min(parseInt(req.query?.limit) || 5000, 20000);

  const out = { sport, dry, scanned: 0, matched: 0, updated: 0, skipped: 0, reasons: {}, datesFetched: 0, samples: [] };
  const bump = (k) => { out.reasons[k] = (out.reasons[k] || 0) + 1; };

  try {
    // 1) Pull all W/L picks missing a score (paged).
    const picks = [];
    for (let offset = 0; picks.length < hardCap; offset += 1000) {
      const page = await sbGet(`picks?result=in.(W,L)&home_score=is.null&select=id,game,game_date,result&order=game_date.asc&limit=1000&offset=${offset}`);
      if (!Array.isArray(page) || page.length === 0) break;
      picks.push(...page);
      if (page.length < 1000) break;
    }
    out.scanned = picks.length;
    if (!picks.length) return res.status(200).json({ ...out, note: "Nothing to backfill." });

    // 2) Build the set of ESPN dates we need (each pick's day ± 1, UTC), then fetch once each.
    const dateSet = new Set();
    for (const p of picks) {
      if (!p.game_date) continue;
      const t = Date.parse(p.game_date);
      if (isNaN(t)) continue;
      for (const off of [-1, 0, 1]) dateSet.add(ymdUTC(new Date(t + off * 86400000)));
    }
    const pool = [], seen = new Set();
    for (const day of dateSet) { await fetchESPNday(em, day, pool, seen); }
    out.datesFetched = dateSet.size;
    out.poolGames = pool.length;

    // 3) Match each pick to its game and stage/apply the update.
    for (const p of picks) {
      const teams = parseMatchupTeams(p.game || "");
      if (!teams) { out.skipped++; bump("no_matchup_teams"); continue; } // longshot leg (player name) / unparseable
      const want = p.game_date ? Date.parse(p.game_date) : NaN;
      let game = null;
      if (!isNaN(want)) {
        let best = null;
        for (const g of pool) { if (!bothTeams(teams, g) || !g.date) continue; const diff = Math.abs(Date.parse(g.date) - want); if (best === null || diff < best.diff) best = { g, diff }; }
        if (best && best.diff <= 24 * 3600 * 1000) game = best.g;
      } else {
        const c = pool.filter(g => bothTeams(teams, g));
        if (c.length === 1) game = c[0]; // no date -> only safe if unambiguous
      }
      if (!game) { out.skipped++; bump(isNaN(want) ? "no_date_ambiguous" : "game_not_in_espn_feed"); continue; }
      if (!game.completed) { out.skipped++; bump("game_not_completed"); continue; }
      if (!(game.home_score >= 0) || !(game.away_score >= 0)) { out.skipped++; bump("scores_unavailable"); continue; }

      out.matched++;
      if (out.samples.length < 12) out.samples.push({ id: p.id, game: p.game, score: `${game.away_score}-${game.home_score}` });
      if (dry) continue;
      try {
        await sbPatch(`picks?id=eq.${p.id}`, { home_score: game.home_score, away_score: game.away_score, final_status: "final" });
        out.updated++;
      } catch (e) { out.skipped++; bump("patch_failed"); }
    }

    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ ...out, error: String(e && e.message || e) });
  }
}
