// api/plokboard.js — Plok's public track record, Lock of the Day, and ledger.
//
// The client's old record read queried plok_calls with eq(user_id, me), so every
// user saw a different, tiny "Plok record" (Joe's showed 13 calls while the table
// held 90 graded rows). Plok has ONE record: every graded row in plok_calls,
// across users and pipelines, settled by the same engine as user picks. RLS
// rightly blocks cross-user reads from the client, so the global numbers come
// from here with the service key.
//
// Auth: any signed-in user (record visibility is the selling point — free users
// see the scoreboard; the full read behind it stays Pro-gated in the client).
//
// GET /api/plokboard            -> { record, recent, lock }
// GET /api/plokboard?ledger=1   -> adds { ledger, ledgerTotal }  (&page=N, 20/page)
//
// ENV: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, VITE_SUPABASE_ANON_KEY

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON = process.env.VITE_SUPABASE_ANON_KEY;
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

// The cron's synthetic owner (vercel.json ?logas=...): its pending row with the
// highest edge for today IS the Lock of the Day.
const CRON_UID = "00000000-0000-4000-a000-00000000b10c";

const BET_LABELS = { ml: "Moneyline", spread: "Spread", ou: "Total", prop: "Player prop" };

async function sbGet(path) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch { return []; }
}

async function authed(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token || !SB_URL || !SB_ANON) return false;
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const u = await r.json();
    return !!(u && u.id);
  } catch { return false; }
}

// The record + lock are identical for everyone, so one warm-instance fetch can
// serve every caller for 2 minutes.
let _cache = null; // { at, board }
const CACHE_MS = 120 * 1000;

// Parse the edge the cron bakes into verdict ("cron_ev_3.4") — in-app rows have
// no comparable number, so lock.edge is null when the lock came from that path.
function edgeOf(row) {
  const m = String(row.verdict || "").match(/^cron_ev_([\d.]+)$/);
  return m ? parseFloat(m[1]) : null;
}

async function buildBoard() {
  // Every graded call, newest game first — one query feeds record, streak, and pips.
  const graded = await sbGet("plok_calls?result=in.(W,L)&select=result,odds,game_date,created_at&order=game_date.desc.nullslast&limit=2000");
  let w = 0, l = 0, units = 0;
  for (const c of graded) {
    const o = parseInt(String(c.odds || "").replace(/[^0-9+-]/g, ""), 10);
    const dec = Number.isFinite(o) ? (o > 0 ? o / 100 + 1 : 100 / Math.abs(o) + 1) : 2;
    if (c.result === "W") { w++; units += dec - 1; } else { l++; units -= 1; }
  }
  let streak = null;
  if (graded.length) {
    const lead = graded[0].result;
    let n = 0; for (const c of graded) { if (c.result === lead) n++; else break; }
    streak = lead + n;
  }
  let since = null;
  const oldest = graded.reduce((a, c) => {
    const t = Date.parse(c.created_at || "");
    return Number.isFinite(t) && (a == null || t < a) ? t : a;
  }, null);
  if (oldest != null) since = new Date(oldest).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Lock of the Day: the cron's best still-pending call whose game hasn't long started.
  const cutoff = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  const locks = await sbGet(`plok_calls?user_id=eq.${CRON_UID}&result=eq.pending&game_date=gte.${cutoff}&select=sport,bet_type,selection,game,odds,verdict,game_date&order=created_at.desc&limit=5`);
  let lock = null;
  if (locks.length) {
    const best = locks.slice().sort((a, b) => (edgeOf(b) || 0) - (edgeOf(a) || 0))[0];
    lock = {
      sport: best.sport, betType: best.bet_type, betLabel: BET_LABELS[best.bet_type] || best.bet_type,
      selection: best.selection, game: best.game, odds: best.odds,
      edge: edgeOf(best), gameDate: best.game_date,
    };
  }

  return {
    record: {
      w, l,
      pct: (w + l) ? Math.round((w / (w + l)) * 100) : 0,
      units: parseFloat(units.toFixed(1)),
      streak, since,
    },
    recent: graded.slice(0, 10).map((c) => ({ result: c.result })),
    lock,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: "Missing env" });
  if (!(await authed(req))) return res.status(401).json({ error: "Sign in required" });

  try {
    if (!_cache || Date.now() - _cache.at > CACHE_MS) {
      _cache = { at: Date.now(), board: await buildBoard() };
    }
    const out = { ..._cache.board };

    if (req.query && req.query.ledger === "1") {
      const page = Math.max(0, parseInt(req.query.page || "0", 10) || 0);
      // Ledger pages are user-driven and small; not worth caching.
      const rows = await sbGet(
        `plok_calls?result=in.(W,L)&select=selection,game,odds,result,sport,game_date&order=game_date.desc.nullslast&limit=20&offset=${page * 20}`
      );
      out.ledger = rows.map((r) => ({
        selection: r.selection, game: r.game, odds: r.odds, result: r.result, sport: r.sport,
        date: r.game_date ? new Date(r.game_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
      }));
      out.ledgerTotal = _cache.board.record.w + _cache.board.record.l;
      out.page = page;
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(out);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
