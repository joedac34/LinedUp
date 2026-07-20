/**
 * /api/admin.js — lightweight founder dashboard data. JSON only; render anywhere.
 *
 *   GET /api/admin  with  Authorization: Bearer <ADMIN_SECRET>
 *
 * Returns signups (1/7/30d + total), pro counts (revenue proxy), active leagues
 * (leagues with picks in the last 7d), pick volume, referral totals, and api_usage
 * rollup by endpoint for the last 7 days (if the table exists).
 *
 * Fail-closed: no ADMIN_SECRET env = 500; wrong bearer = 401.
 *
 * ENV: ADMIN_SECRET, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const sbH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

async function sbCount(path) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { ...sbH, Prefer: "count=exact" }, method: "HEAD",
    });
    const cr = r.headers.get("content-range") || "";
    const n = parseInt(cr.split("/")[1], 10);
    return Number.isFinite(n) ? n : null;
  } catch (e) { return null; }
}

async function sbRows(path) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbH });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch (e) { return []; }
}

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();

export default async function handler(req, res) {
  const SECRET = process.env.ADMIN_SECRET;
  if (!SECRET) return res.status(500).json({ error: "ADMIN_SECRET not set" });
  if ((req.headers.authorization || "") !== `Bearer ${SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: "missing supabase env" });

  const [
    usersTotal, users1d, users7d, users30d,
    proTotal, referredTotal, referred7d,
    picks7d, leaguesTotal,
  ] = await Promise.all([
    sbCount("public_profiles?select=id"),
    sbCount(`public_profiles?select=id&created_at=gte.${iso(1)}`),
    sbCount(`public_profiles?select=id&created_at=gte.${iso(7)}`),
    sbCount(`public_profiles?select=id&created_at=gte.${iso(30)}`),
    sbCount("public_profiles?select=id&is_pro=eq.true"),
    sbCount("public_profiles?select=id&referred_by=not.is.null"),
    sbCount(`public_profiles?select=id&referred_by=not.is.null&created_at=gte.${iso(7)}`),
    sbCount(`picks?select=id&created_at=gte.${iso(7)}`),
    sbCount("leagues?select=id"),
  ]);

  // Active leagues = distinct league_id with picks in the last 7 days.
  const recentPickLeagues = await sbRows(`picks?select=league_id&created_at=gte.${iso(7)}&limit=5000`);
  const activeLeagueIds = new Set(recentPickLeagues.map((p) => p.league_id).filter(Boolean));

  // Referral leaderboard (top 10 referrers).
  const refRows = await sbRows("public_profiles?select=referred_by&referred_by=not.is.null&limit=5000");
  const refCounts = {};
  refRows.forEach((r) => { refCounts[r.referred_by] = (refCounts[r.referred_by] || 0) + 1; });
  const topReferrers = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([code, n]) => ({ code, signups: n }));

  // API consumption rollup, last 7 days, if api_usage exists.
  let usage = null;
  const usageRows = await sbRows(`api_usage?select=endpoint,upstream&created_at=gte.${iso(7)}&limit=10000`);
  if (usageRows.length) {
    const agg = {};
    usageRows.forEach((u) => {
      const a = (agg[u.endpoint] = agg[u.endpoint] || { calls: 0, upstream: 0 });
      a.calls++; a.upstream += Number(u.upstream) || 0;
    });
    usage = agg;
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    at: new Date().toISOString(),
    signups: { total: usersTotal, last24h: users1d, last7d: users7d, last30d: users30d },
    pro: {
      total: proTotal,
      // Revenue proxy until Stripe go-live reporting exists: pro count x $10/mo floor.
      mrrFloorUsd: proTotal != null ? proTotal * 10 : null,
    },
    leagues: { total: leaguesTotal, activeLast7d: activeLeagueIds.size },
    picks: { last7d: picks7d },
    referrals: { total: referredTotal, last7d: referred7d, topReferrers },
    apiUsage7d: usage, // null until api_usage table exists + endpoints log
  });
}
