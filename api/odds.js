export default async function handler(req, res) {
  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: "Missing sport parameter" });

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const now = new Date().toISOString().split(".")[0] + "Z";

  // Query a broad set of US books so we get coverage even if one hasn't posted
  // a line yet. We then collapse all of them into a single best-line bookmaker.
  const bookmakers = "draftkings,fanduel,betmgm,williamhill_us,betrivers";

  // American odds -> decimal payout (used to compare "best price")
  const decimal = (o) => (o > 0 ? o / 100 + 1 : 100 / Math.abs(o) + 1);
  // American odds -> raw implied probability (with vig)
  const impliedAm = (o) => (o > 0 ? 100 / (o + 100) : -o / (-o + 100));

  // Pick the better of two outcomes for the SAME selection, per market type.
  function pickBetter(marketKey, name, a, b) {
    if (marketKey === "spreads") {
      // Higher point is always more favorable to the bettor
      // (favorite -3 beats -3.5; underdog +3.5 beats +3). Tie-break on price.
      if (b.point !== a.point) return b.point > a.point ? b : a;
      return decimal(b.price) > decimal(a.price) ? b : a;
    }
    if (marketKey === "totals") {
      // Over wants the LOWER line; Under wants the HIGHER line. Tie-break on price.
      const isOver = (name || "").toLowerCase() === "over";
      if (b.point !== a.point) return (isOver ? b.point < a.point : b.point > a.point) ? b : a;
      return decimal(b.price) > decimal(a.price) ? b : a;
    }
    // h2h (moneyline) and anything else: best price wins
    return decimal(b.price) > decimal(a.price) ? b : a;
  }

  // Collapse all bookmakers of a game into one "best line" bookmaker.
  function collapse(game) {
    const best = {}; // marketKey -> { selectionName -> outcome }
    // Per-book de-vigged fair probabilities, grouped by exact (name|point) so we
    // only ever average like-for-like lines. probs[mKey][key] = [fairProb, ...]
    const probs = {};
    for (const bk of game.bookmakers || []) {
      for (const mk of bk.markets || []) {
        const mKey = mk.key;
        if (!best[mKey]) best[mKey] = {};
        if (!probs[mKey]) probs[mKey] = {};
        const outs = mk.outcomes || [];
        for (const oc of outs) {
          const sel = oc.name;
          best[mKey][sel] = best[mKey][sel]
            ? pickBetter(mKey, sel, best[mKey][sel], oc)
            : { ...oc };
        }
        // De-vig this book's two-way market into a fair probability per side.
        if (outs.length === 2) {
          const imp = outs.map((o) => impliedAm(o.price));
          const sum = imp[0] + imp[1];
          if (sum > 0) {
            outs.forEach((oc, i) => {
              const k = oc.point != null ? `${oc.name}|${oc.point}` : oc.name;
              (probs[mKey][k] = probs[mKey][k] || []).push(imp[i] / sum);
            });
          }
        }
      }
    }
    const markets = Object.entries(best).map(([key, outs]) => ({
      key,
      outcomes: Object.values(outs).map((oc) => {
        // Attach a real +EV edge: how much the BEST available price beats the
        // de-vigged consensus fair line (needs >=2 books for a stable read).
        const k = oc.point != null ? `${oc.name}|${oc.point}` : oc.name;
        const arr = (probs[key] && probs[key][k]) || [];
        let edge = null;
        if (arr.length >= 2) {
          const fair = arr.reduce((a, b) => a + b, 0) / arr.length;
          edge = Number((decimal(oc.price) * fair - 1).toFixed(4)); // >0 = +EV
        }
        return { ...oc, edge };
      }),
    }));
    return { ...game, bookmakers: markets.length ? [{ key: "best", title: "Best Line", markets }] : [] };
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&bookmakers=${bookmakers}&dateFormat=iso&oddsFormat=american&commenceTimeFrom=${now}`;
    const response = await fetch(url);
    if (!response.ok) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ games: [], remaining: null, used: null });
    }
    const data = await response.json();
    const remaining = response.headers.get("x-requests-remaining");
    const used = response.headers.get("x-requests-used");

    let games = Array.isArray(data) ? data.filter(g => g.bookmakers?.length > 0).map(collapse) : [];

    // Also pull the upcoming schedule (the /events endpoint is free and does NOT
    // count against quota) so we can show TOMORROW'S matchups the night before,
    // even before the books have posted lines. Any event within the next ~36h
    // that has no odds yet is added with empty bookmakers, so it shows up as an
    // upcoming matchup (no bets are available until its lines post).
    try {
      const evUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${apiKey}&dateFormat=iso&commenceTimeFrom=${now}`;
      const evRes = await fetch(evUrl);
      if (evRes.ok) {
        const events = await evRes.json();
        const have = new Set(games.map(g => g.id));
        const cutoff = Date.now() + 36 * 3600 * 1000;
        for (const ev of (Array.isArray(events) ? events : [])) {
          if (!ev || have.has(ev.id)) continue;
          if (new Date(ev.commence_time).getTime() > cutoff) continue;
          games.push({ id: ev.id, sport_key: ev.sport_key, commence_time: ev.commence_time, home_team: ev.home_team, away_team: ev.away_team, bookmakers: [] });
        }
      }
    } catch (e) { /* schedule is best-effort; never block odds on it */ }

    games.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));

    // A team can appear twice inside the 36h window (it plays tonight AND tomorrow),
    // producing two entries for the same matchup. A pick can then bind to the wrong
    // night. Keep only the NEAREST upcoming game per matchup (already sorted ascending),
    // so ml/spread/ou picks always attach to the soonest game and grade on the right night.
    const _seenMatchup = new Set();
    games = games.filter(g => {
      const k = (g.away_team || "") + "@" + (g.home_team || "");
      if (_seenMatchup.has(k)) return false;
      _seenMatchup.add(k);
      return true;
    });

    // --- MLB: hydrate probable starting pitchers from the free MLB StatsAPI ---
    // Keyless, best-effort: any failure just leaves pitchers null (frontend shows TBD).
    if (sport === "baseball_mlb" && games.length) {
      try {
        const day = now.split("T")[0];
        const sched = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${day}&hydrate=probablePitcher`)
          .then(r => (r.ok ? r.json() : null)).catch(() => null);
        const rows = sched && sched.dates ? sched.dates.flatMap(d => d.games || []) : [];
        const ids = new Set();
        rows.forEach(gm => {
          const hp = gm.teams && gm.teams.home && gm.teams.home.probablePitcher;
          const ap = gm.teams && gm.teams.away && gm.teams.away.probablePitcher;
          if (hp && hp.id) ids.add(hp.id);
          if (ap && ap.id) ids.add(ap.id);
        });
        const handById = {};
        if (ids.size) {
          const ppl = await fetch(`https://statsapi.mlb.com/api/v1/people?personIds=${[...ids].join(",")}`)
            .then(r => (r.ok ? r.json() : null)).catch(() => null);
          ((ppl && ppl.people) || []).forEach(p => { if (p && p.id && p.pitchHand && p.pitchHand.code) handById[p.id] = p.pitchHand.code; });
        }
        const fmt = (pp) => {
          if (!pp || !pp.fullName) return null;
          const parts = String(pp.fullName).trim().split(/\s+/);
          const nm = parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(" ")}` : pp.fullName;
          const hand = handById[pp.id];
          return hand ? `${nm} (${hand})` : nm;
        };
        const norm = (x) => String(x || "").toLowerCase().replace(/[^a-z]/g, "");
        const byHome = {};
        rows.forEach(gm => {
          const h = gm.teams && gm.teams.home && gm.teams.home.team && gm.teams.home.team.name;
          if (h) byHome[norm(h)] = { home: fmt(gm.teams.home.probablePitcher), away: fmt(gm.teams.away && gm.teams.away.probablePitcher) };
        });
        games.forEach(g => {
          const rec = byHome[norm(g.home_team)];
          if (rec) { g.home_pitcher = rec.home || null; g.away_pitcher = rec.away || null; }
        });
      } catch (e) { /* pitchers are best-effort; never block odds */ }
    }

    // Shared edge cache: the odds payload is identical for every user, so let Vercel's CDN
    // serve one upstream pull to all users per window instead of hitting the Odds API per client.
    // ~3 min fresh + 5 min stale-while-revalidate keeps lines current while decoupling cost from user count.
    res.setHeader("Cache-Control", "public, s-maxage=180, stale-while-revalidate=300");
    return res.status(200).json({ games, remaining, used });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch odds" });
  }
}