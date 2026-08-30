// /api/award-spin.js — spin award for MANUAL league advances.
//
// Why this exists: the commissioner's manual Advance runs client-side, and RLS
// (correctly) blocks a client from writing other members' league_members rows.
// That's why the old client-side award could only ever award the commissioner
// themselves. This endpoint runs with the service key: the client calls it right
// after bumping current_week, and the actual top scorer gets the spin whoever
// tapped the button.
//
// Shares the last_spin_week guard with awardTopScorerSpin in advance.js, so the
// Tuesday cron and a manual advance can never double-award the same week.
//
// Auth: caller must be a signed-in member; only the league's commissioner can
// trigger an award (they're the only one who can advance).

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth" });

  const url = process.env.VITE_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !service) return res.status(500).json({ error: "Server not configured" });
  const supabase = createClient(url, service);

  // Resolve the caller from their JWT — never trust a user_id in the body.
  const { data: userData, error: authErr } = await supabase.auth.getUser(token);
  const caller = userData && userData.user;
  if (authErr || !caller) return res.status(401).json({ error: "Invalid session" });

  const { league_id, week } = req.body || {};
  const wk = parseInt(week, 10);
  if (!league_id || !wk || wk < 1 || wk > 60) return res.status(400).json({ error: "league_id and week required" });

  const { data: lg } = await supabase.from("leagues")
    .select("id, league_type, power_ups_enabled, commissioner_id")
    .eq("id", league_id).maybeSingle();
  if (!lg) return res.status(404).json({ error: "League not found" });
  if (String(lg.commissioner_id) !== String(caller.id)) return res.status(403).json({ error: "Commissioner only" });

  // Same rules as the cron: h2h only, toggle not off.
  if ((lg.league_type || "h2h") !== "h2h") return res.status(200).json({ awarded: [], reason: "not_h2h" });
  if (lg.power_ups_enabled === false) return res.status(200).json({ awarded: [], reason: "power_ups_off" });

  const { data: picks } = await supabase.from("picks")
    .select("user_id, points_earned")
    .eq("league_id", league_id).eq("week", wk);
  if (!Array.isArray(picks) || !picks.length) return res.status(200).json({ awarded: [], reason: "no_picks" });

  const totals = {};
  for (const p of picks) totals[p.user_id] = (totals[p.user_id] || 0) + (Number(p.points_earned) || 0);
  const best = Math.max(...Object.values(totals));
  if (!(best > 0)) return res.status(200).json({ awarded: [], reason: "zero_week" });

  const winners = Object.keys(totals).filter((u) => totals[u] === best);
  const awarded = [];
  for (const uid of winners) {
    const { data: m } = await supabase.from("league_members")
      .select("wheel_spins, last_spin_week")
      .eq("league_id", league_id).eq("user_id", uid).maybeSingle();
    if (!m) continue;
    if (m.last_spin_week != null && m.last_spin_week >= wk) continue; // cron got here first
    const { error: upErr } = await supabase.from("league_members")
      .update({ wheel_spins: (m.wheel_spins || 0) + 1, last_spin_week: wk })
      .eq("league_id", league_id).eq("user_id", uid);
    if (!upErr) awarded.push(uid);
  }
  return res.status(200).json({ awarded, top: best, week: wk });
}
