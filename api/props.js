const PROP_MARKETS = {
  americanfootball_nfl: [
    // player_first_td removed: settlement needs scoring-play ORDER, which the box
    // score does not carry. Never offer a pick type that cannot be graded.
    "player_anytime_td","player_pass_yds","player_pass_tds",
    "player_rush_yds","player_receptions","player_reception_yds","player_rush_tds","player_reception_tds",
  ],
  basketball_nba: [
    "player_points","player_rebounds","player_assists","player_threes","player_points_rebounds_assists",
  ],
  baseball_mlb: [
    "batter_home_runs","batter_hits","batter_total_bases","batter_rbis","pitcher_strikeouts",
    // batch 1 (all gradeable by grade.js STAT_ALIASES):
    "batter_runs_scored","batter_walks","batter_stolen_bases","pitcher_earned_runs","pitcher_hits_allowed",
    // batch 2 (gradeable now; walks-allowed resolves via "walks" -> pitcher BB):
    "batter_doubles","batter_triples","pitcher_walks",
    // batch 3: H+R+RBI (grade.js derives H+R+RBI)
    "batter_hits_runs_rbis","batter_singles",
    // pitcher outs (outs recorded) — starting-pitcher market, posts near game time:
    "pitcher_outs",
    // HR is usually a "to hit a HR" (1+) milestone -> alternate key
    "batter_home_runs_alternate",
  ],
};

const MARKET_LABELS = {
  player_anytime_td:"Anytime TD", player_first_td:"First TD",
  player_pass_yds:"Pass Yds", player_pass_tds:"Pass TDs", player_rush_yds:"Rush Yds",
  player_receptions:"Receptions", player_reception_yds:"Rec Yds",
  player_rush_tds:"Rush TDs", player_reception_tds:"Rec TDs",
  player_points:"Points", player_rebounds:"Rebounds", player_assists:"Assists",
  player_threes:"3-Pointers", player_points_rebounds_assists:"Pts+Reb+Ast",
  batter_home_runs:"Home Runs", batter_hits:"Hits", batter_total_bases:"Total Bases",
  batter_rbis:"RBIs", pitcher_strikeouts:"Strikeouts",
  batter_runs_scored:"Runs", batter_walks:"Walks", batter_stolen_bases:"Stolen Bases",
  pitcher_earned_runs:"Earned Runs", pitcher_hits_allowed:"Hits Allowed",
  batter_doubles:"Doubles", batter_triples:"Triples", pitcher_walks:"Walks Allowed",
  batter_hits_runs_rbis:"Hits+Runs+RBIs", batter_singles:"Singles", batter_home_runs_alternate:"Home Runs",
  pitcher_outs:"Outs",
};

// ── Caller verification (SOFT by default) ────────────────────────────────────
// These endpoints spend metered Odds API credits, so they should require a real
// Supabase user token. BUT the native app ships a frozen copy of App.jsx: a build
// compiled before the client started sending Authorization headers cannot be
// patched without an App Store release. Rejecting those callers takes odds away
// from every tester on an older build.
//
// So: verify, LOG, and let it through. Set ODDS_REQUIRE_AUTH=1 in Vercel env once
// the logs show no more anonymous callers (i.e. every tester has updated), and
// this starts returning 401 with no code change.
const ENFORCE_AUTH = process.env.ODDS_REQUIRE_AUTH === "1";

async function requireUser(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  const base = process.env.VITE_SUPABASE_URL;
  const apikey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !apikey) return null;
  try {
    const r = await fetch(base + "/auth/v1/user", {
      headers: { apikey, Authorization: "Bearer " + token },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u : null;
  } catch (e) { return null; }
}

// Returns true if the request should be REJECTED.
async function authBlocked(req, route) {
  const caller = await requireUser(req);
  if (caller) return false;
  if (ENFORCE_AUTH) return true;
  // Grep these in Vercel logs to see when legacy clients have drained away.
  console.warn("[anon-call] " + route + " ua=" + String(req.headers["user-agent"] || "").slice(0, 80));
  return false;
}

export default async function handler(req, res) {
  if (await authBlocked(req, "props")) return res.status(401).json({ error: "unauthorized" });
  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: "Missing sport parameter" });
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });
  const markets = PROP_MARKETS[sport];
  if (!markets) return res.status(400).json({ error: "No prop markets for sport" });

  try {
    const now = new Date().toISOString().split(".")[0] + "Z";
    const eventsRes = await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${apiKey}&dateFormat=iso&commenceTimeFrom=${now}`);
    if (!eventsRes.ok) return res.status(200).json({ props: [] });
    const events = await eventsRes.json();
    if (!Array.isArray(events) || events.length === 0) return res.status(200).json({ props: [] });

    events.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    // Default 7 days. ?days=N widens it, which is the only way to see a sport whose
    // entire slate sits beyond the window: in August the NFL feed's earliest game is
    // ~21 days out (it carries no preseason), so the default filters all 272 events
    // away and the endpoint returns an empty slate. Capped at 45 — every additional
    // game inside the window is a metered odds call, so this is a testing lever, not
    // something to leave widened.
    const windowDays = Math.min(45, Math.max(1, Number(req.query.days) || 7));
    const cutoff = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000);
    const upcomingEvents = events.filter(e => new Date(e.commence_time) <= cutoff);

    const props = [];
    const debugRows = req.query.debug ? [] : null; // ?debug=1 -> report which markets the API actually returns per game
    const marketsParam = markets.join(",");
    const bookmakers = "draftkings,fanduel,betmgm";

    // Was capped at 6 — a 15-game slate showed props for fewer than half the games, so the
    // later games were unpickable. The 5-min CDN cache above means this cost is paid once
    // per 5 min across ALL users, not per open, so a full slate is affordable. Hard ceiling
    // of 18 guards against a freak day (doubleheaders) blowing the Odds quota.
    const TODAY_CAP = 18;
    const slate = upcomingEvents.slice(0, TODAY_CAP);
    // Fetch every game's odds IN PARALLEL. Sequential await in a loop meant 18 games took
    // 6-9s of round-trips and risked a serverless timeout returning a partial/empty slate.
    // Promise.all makes 18 games cost about the same wall-time as 1.
    const results = await Promise.all(slate.map(async (event) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${event.id}/odds?apiKey=${apiKey}&regions=us&markets=${marketsParam}&bookmakers=${bookmakers}&oddsFormat=american`;
      try {
        const r = await fetch(url);
        if (!r.ok) return { event, data: null };
        return { event, data: await r.json() };
      } catch (e) { return { event, data: null }; }
    }));

    for (const { event, data } of results) {
      const gameLabel = `${event.away_team} @ ${event.home_team}`;
      if (!data) { if (debugRows) debugRows.push({ game: gameLabel, time: event.commence_time, note: "fetch failed", markets: [] }); continue; }
      if (!data.bookmakers || !data.bookmakers.length) { if (debugRows) debugRows.push({ game: gameLabel, time: event.commence_time, note: "no bookmakers returned", markets: [] }); continue; }
      if (debugRows) { const _ks = new Set(); data.bookmakers.forEach(bk => bk.markets?.forEach(m => _ks.add(m.key))); debugRows.push({ game: gameLabel, time: event.commence_time, hasHR: _ks.has("batter_home_runs") || _ks.has("batter_home_runs_alternate"), markets: [..._ks] }); }

      // Merge markets across ALL books (each book carries a different subset),
      // de-duping the same player+market+line+side so we don't triple-list it.
      const seen = new Set();
      data.bookmakers.forEach(bk => {
        bk.markets?.forEach(market => {
          const marketLabel = MARKET_LABELS[market.key] || market.key;
          const isTD = market.key === "player_anytime_td" || market.key === "player_first_td";
          market.outcomes?.forEach(outcome => {
            if (market.key === "batter_home_runs_alternate" && outcome.point !== 0.5) return;
            let label, dedupKey;
            if (isTD) {
              // This market comes back YES/NO shaped: outcome.name is "Yes" and the
              // player is in outcome.description. Reading .name gave every outcome the
              // same label, so the dedupe set below collapsed a whole game's 46 TD
              // outcomes (26 distinct players) into ONE row reading "Yes - Anytime TD"
              // — which grade.js then tried to look up as a player named "Yes". This is
              // why anytime TD had never settled a real pick, and why a survivor pool
              // only ever had one selectable player per week.
              // Verified against a live DraftKings + FanDuel payload: 46/46 outcomes
              // name=Yes, 46/46 description=player. Some books may still put the player
              // in .name, so accept either rather than assuming this shape everywhere.
              const nm = outcome.name || "";
              if (/^no$/i.test(nm)) return;   // the "will not score" side is not offered
              let player = outcome.description || (/^yes$/i.test(nm) ? null : nm);
              if (!player) return;            // no player attached -> unusable, never emit it
              // Books disagree on how they write a team defence: DraftKings sends
              // "Seattle Seahawks D/ST", another book sends "Seattle Seahawks Defense".
              // Different strings meant the dedupe below never collided and the same
              // defence appeared twice at two different prices. Normalise to one form.
              player = player.replace(/\s+(?:D\s*\/\s*ST|DST|Defense)$/i, " D/ST");
              label = `${player} - ${marketLabel}`;
              dedupKey = `${market.key}|${player}`;
            } else {
              const player = outcome.description || outcome.name;
              const direction = outcome.name === "Over" || outcome.name === "Under" ? outcome.name : "";
              const line = outcome.point != null ? outcome.point : "";
              label = `${player} ${direction} ${line} ${marketLabel}`.replace(/\s+/g, " ").trim();
              dedupKey = `${market.key}|${player}|${direction}|${line}`;
            }
            if (seen.has(dedupKey)) return;
            seen.add(dedupKey);
            props.push({
              id: `prop_${event.id}_${market.key}_${props.length}`,
              game: gameLabel,
              gameTime: event.commence_time,
              eventId: event.id,
              pick: label,
              market: market.key,
              odds: outcome.price >= 0 ? `+${outcome.price}` : `${outcome.price}`,
              impliedOdds: outcome.price,
            });
          });
        });
      });
    }

    if (debugRows) return res.status(200).json({ requested: markets, events: debugRows });

    // Props are identical for every user and all pre-game, so let Vercel's CDN serve one
    // upstream pull to all users per window instead of hitting the Odds API per client.
    // Never pin an empty slate: a short TTL lets real props reappear fast after a blip.
    if (props.length > 0) {
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    } else {
      res.setHeader("Cache-Control", "public, s-maxage=20");
    }
    return res.status(200).json({ props });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch props" });
  }
}