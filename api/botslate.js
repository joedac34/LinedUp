import { createClient } from "@supabase/supabase-js";

// Bot slates for the "You vs The Bots" race. Each bot fills toward 10 picks per
// week from the live odds board, by persona rule. Runs daily (idempotent top-up),
// so picks accrue in created_at order — which is exactly the order the client
// truncates against a user's own pick count. Rows are ordinary picks in the Bot
// Colosseum league; grade.js settles them like anyone else's.
//
// Multipliers follow the fixed pattern below in fill order: two picks at every
// tier across a full week, deterministic and identical for every user's race.

const BOTS_LEAGUE = "00000000-0000-4000-a000-0000000b0750";
const ANCHOR_MS = Date.parse("2026-01-05T07:00:00Z"); // Monday ~3 AM ET
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MULT_PATTERN = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
const SLATE_SIZE = 10;

const BOTS = [
  { id: "00000000-0000-4000-b000-000000000001", key: "chalky" },
  { id: "00000000-0000-4000-b000-000000000002", key: "bigdog" },
  { id: "00000000-0000-4000-b000-000000000003", key: "homer" },
  { id: "00000000-0000-4000-b000-000000000004", key: "coinflip" },
  { id: "00000000-0000-4000-b000-000000000005", key: "traitor" },
  { id: "00000000-0000-4000-b000-000000000006", key: "overlord", props: true },
];

// MLB-only for v1: the stale grade.js reference keys score fetches off league.sport,
// so cross-sport picks in this mlb league may not grade. Flip NFL on after the
// current grade.js confirms per-pick sport resolution (or before Week 1 regardless,
// once verified). The league row already carries sports=['mlb','nfl'].
const SPORTS = [
  { odds: "baseball_mlb", app: "mlb" },
];

// OVERLORD's market menu + labels. pick_name must read exactly like a user prop row
// ("Aaron Judge Over 1.5 Total Bases") because grade.js parses the name to grade
// prop slots. Labels mirror props.js MARKET_LABELS verbatim.
const PROP_MARKETS = ["batter_total_bases", "batter_hits", "batter_home_runs", "batter_rbis", "pitcher_strikeouts"];
const PROP_LABELS = {
  batter_total_bases: "Total Bases", batter_hits: "Hits", batter_home_runs: "Home Runs",
  batter_rbis: "RBIs", pitcher_strikeouts: "Strikeouts",
};
// Per-event props calls are metered, so this is a real cost knob — but at 3 the bot
// took three days to reach a full slate, and the race truncates every bot to the
// user's pick count, which quietly handicapped him the whole time. 8 fills him in a
// single run for a handful of extra calls a day.
const PROP_EVENTS_PER_RUN = 8;

const weekOf = (ms) => Math.floor((ms - ANCHOR_MS) / WEEK_MS) + 1;

function amNum(o) {
  const n = parseInt(String(o == null ? "" : o).replace(/[^-+0-9]/g, ""), 10);
  return isNaN(n) ? null : n;
}
function amStr(n) { return n > 0 ? "+" + n : String(n); }
function implied(n) {
  if (n == null) return null;
  return n > 0 ? Math.round((100 / (n + 100)) * 1000) / 10 : Math.round((-n / (-n + 100)) * 1000) / 10;
}
// Deterministic coin: hash of event id, so reruns never flip a side.
function coin(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return (h & 1) === 0;
}

// Flatten one event's first-bookmaker markets into candidate selections.
function candidatesOf(ev, appSport) {
  const out = [];
  const home = ev.home_team, away = ev.away_team;
  const game = away + " @ " + home;
  const t = ev.commence_time;
  const bk = (ev.bookmakers || [])[0];
  if (!bk) return out;
  for (const mk of bk.markets || []) {
    if (!["h2h", "spreads", "totals"].includes(mk.key)) continue;
    for (const o of mk.outcomes || []) {
      const n = amNum(o.price);
      if (n == null) continue;
      const point = o.point != null ? o.point : null;
      const isHome = o.name === home;
      let pick;
      if (mk.key === "h2h") pick = o.name + " ML";
      else if (mk.key === "spreads") pick = o.name + " " + (point >= 0 ? "+" + point : String(point));
      else pick = o.name + " " + point; // Over 8.5 / Under 8.5
      out.push({
        eventId: ev.id, game, gameTime: t, sport: appSport,
        market: mk.key, outcome: o.name, point,
        pick, odds: n, isHome,
        selKey: ev.id + "|" + mk.key + "|" + o.name + "|" + (point != null ? point : ""),
      });
    }
  }
  return out;
}

// Persona rules. Each returns the bot's preferred ordering of ONE candidate per event.
function pickForBot(key, evCands) {
  const ml = evCands.filter((c) => c.market === "h2h");
  if (key === "chalky") {
    const c = ml.slice().sort((a, b) => a.odds - b.odds)[0]; // most negative = heaviest favorite
    return c || null;
  }
  if (key === "bigdog") {
    const c = ml.slice().sort((a, b) => b.odds - a.odds)[0]; // biggest plus price
    return c || null;
  }
  if (key === "homer") {
    return ml.find((c) => c.isHome) || null;
  }
  if (key === "traitor") {
    return ml.find((c) => !c.isHome) || null;
  }
  // coinflip: random market, random side — deterministic per event.
  const pool = evCands;
  if (!pool.length) return null;
  let h = 0; const sid = evCands[0].eventId;
  for (let i = 0; i < sid.length; i++) h = ((h << 5) - h + sid.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

// How each bot ranks its board when there are more games than open slots.
function rankBoard(key, picks) {
  if (key === "chalky") return picks.sort((a, b) => a.odds - b.odds);
  if (key === "bigdog") return picks.sort((a, b) => b.odds - a.odds);
  // homer + coinflip: earliest games first — fills the week evenly.
  return picks.sort((a, b) => new Date(a.gameTime) - new Date(b.gameTime));
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).json({ error: "CRON_SECRET not set" }); // fail CLOSED
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const SB_URL = process.env.VITE_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ODDS_KEY = process.env.ODDS_API_KEY;
  if (!SB_URL || !SB_KEY || !ODDS_KEY) return res.status(500).json({ error: "env not set" });
  const supabase = createClient(SB_URL, SB_KEY);

  try {
    const now = Date.now();
    const week = weekOf(now);
    const wkEnd = ANCHOR_MS + week * WEEK_MS;

    // Board: every future game inside this bot-week, all sports.
    const events = [];
    for (const sp of SPORTS) {
      try {
        const url = "https://api.the-odds-api.com/v4/sports/" + sp.odds +
          "/odds/?apiKey=" + ODDS_KEY +
          "&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso" +
          "&commenceTimeFrom=" + new Date(now).toISOString().replace(/\.\d+Z$/, "Z") +
          "&commenceTimeTo=" + new Date(wkEnd).toISOString().replace(/\.\d+Z$/, "Z");
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        (data || []).forEach((ev) => events.push({ ev, app: sp.app }));
      } catch (e) {}
    }
    if (!events.length) return res.status(200).json({ ok: true, week, filled: {}, note: "no games on the board" });

    const { data: existing } = await supabase
      .from("picks").select("user_id, event_id, slot")
      .eq("league_id", BOTS_LEAGUE).eq("week", week);
    const byBot = {};
    (existing || []).forEach((p) => {
      (byBot[p.user_id] = byBot[p.user_id] || { count: 0, events: new Set() });
      byBot[p.user_id].count++;
      if (p.event_id) byBot[p.user_id].events.add(p.event_id);
    });

    const filled = {};
    for (const bot of BOTS) {
      if (bot.props) continue; // OVERLORD fills from the props branch below
      const st = byBot[bot.id] || { count: 0, events: new Set() };
      let need = SLATE_SIZE - st.count;
      if (need <= 0) { filled[bot.key] = 0; continue; }

      // One preferred selection per event, minus events already on this bot's slate.
      const board = [];
      for (const { ev, app } of events) {
        if (st.events.has(ev.id)) continue;
        const cands = candidatesOf(ev, app);
        const sel = pickForBot(bot.key, cands);
        if (sel) board.push(sel);
      }
      const ranked = rankBoard(bot.key, board).slice(0, need);
      if (!ranked.length) { filled[bot.key] = 0; continue; }

      const rows = ranked.map((c, i) => {
        const idx = st.count + i; // fill order drives slot + multiplier
        return {
          league_id: BOTS_LEAGUE, user_id: bot.id, week,
          slot: "bot_" + idx, multiplier: MULT_PATTERN[idx % MULT_PATTERN.length],
          sport: c.sport, pick_name: c.pick, game: c.game,
          odds: amStr(c.odds), implied_odds: implied(c.odds),
          game_date: c.gameTime, event_id: c.eventId,
          market_key: c.market, outcome: c.outcome,
          outcome_point: c.point, sel_key: c.selKey,
          result: "pending", points_earned: 0,
        };
      });
      const { error } = await supabase.from("picks").insert(rows);
      if (error) { console.warn("[botslate]", bot.key, error.message); filled[bot.key] = 0; }
      else filled[bot.key] = rows.length;
    }

    // ── OVERLORD: Over player props only ─────────────────────────────────────
    // Earliest un-picked games, a bounded number of per-event props calls, and the
    // juiciest Over from each event's board. Rows mirror USER prop rows exactly:
    // slot prop_{idx} (grade.js keys the box-score index off that prefix),
    // pick_name "{Player} Over {line} {Label}", implied_odds = RAW AMERICAN price
    // (the props scoring convention), outcome/outcome_point/sel_key left null.
    const ov = BOTS.find((x) => x.props);
    if (ov) {
      const st = byBot[ov.id] || { count: 0, events: new Set() };
      let need = SLATE_SIZE - st.count;
      if (need > 0) {
        const future = events
          .filter(({ ev }) => !st.events.has(ev.id) && Date.parse(ev.commence_time) > now)
          .sort((x, y) => Date.parse(x.ev.commence_time) - Date.parse(y.ev.commence_time))
          .slice(0, PROP_EVENTS_PER_RUN);
        const rows = [];
        for (const { ev, app } of future) {
          if (rows.length >= need) break;
          try {
            const pu = "https://api.the-odds-api.com/v4/sports/baseball_mlb/events/" + ev.id +
              "/odds?apiKey=" + ODDS_KEY + "&regions=us&markets=" + PROP_MARKETS.join(",") +
              "&oddsFormat=american&dateFormat=iso";
            const pr = await fetch(pu);
            if (!pr.ok) continue;
            const pd = await pr.json();
            const bk = (pd.bookmakers || [])[0];
            if (!bk) continue;
            // Every Over on this event's board; pick the biggest price — the most
            // "career night" of the slate. One prop per game keeps the slate spread.
            const overs = [];
            for (const mk of bk.markets || []) {
              if (!PROP_LABELS[mk.key]) continue;
              for (const o of mk.outcomes || []) {
                if (o.name !== "Over" || !o.description || o.point == null) continue;
                const n = amNum(o.price);
                if (n == null) continue;
                overs.push({ market: mk.key, player: o.description, point: o.point, odds: n });
              }
            }
            if (!overs.length) continue;
            const best = overs.sort((x, y) => y.odds - x.odds)[0];
            const idx = st.count + rows.length;
            rows.push({
              league_id: BOTS_LEAGUE, user_id: ov.id, week,
              slot: "prop_" + idx, multiplier: MULT_PATTERN[idx % MULT_PATTERN.length],
              sport: app, game: ev.away_team + " @ " + ev.home_team,
              pick_name: best.player + " Over " + best.point + " " + PROP_LABELS[best.market],
              odds: amStr(best.odds), implied_odds: best.odds,
              game_date: ev.commence_time, event_id: ev.id,
              market_key: best.market, outcome: null, outcome_point: null, sel_key: null,
              result: "pending", points_earned: 0,
            });
          } catch (e) {}
        }
        if (rows.length) {
          const { error } = await supabase.from("picks").insert(rows);
          if (error) { console.warn("[botslate] overlord", error.message); filled.overlord = 0; }
          else filled.overlord = rows.length;
        } else filled.overlord = 0;
      } else filled.overlord = 0;
    }

    return res.status(200).json({ ok: true, week, filled });
  } catch (err) {
    console.error("botslate error", err);
    return res.status(500).json({ error: "botslate failed" });
  }
}