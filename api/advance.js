import { createClient } from "@supabase/supabase-js";

// Time-derived week roll-over. A "week" is just 7 days from a league's season_start.
// When a week ends (plus a short grace so late finals can grade), every matchup in
// that week is decided W/L from graded picks, and current_week advances.
// Runs on a Vercel cron — no commissioner action required.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const GRACE_MS = 3 * 60 * 60 * 1000; // buffer so late finals grade before a week closes

export default async function handler(req, res) {
  // Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data: leagues, error } = await supabase
      .from("leagues")
      .select("id, current_week, season_weeks, season_start, league_type")
      .not("season_start", "is", null);
    if (error) throw error;

    const advanced = [];
    for (const lg of leagues || []) {
      if ((lg.league_type || "h2h") === "bracket") continue; // brackets settle in grade.js
      const start = new Date(lg.season_start).getTime();
      if (isNaN(start)) continue;

      const seasonWeeks = Number(lg.season_weeks || 18);
      const derived = Math.min(
        seasonWeeks,
        Math.floor((Date.now() - start - GRACE_MS) / WEEK_MS) + 1
      );
      const cw = lg.current_week || 1;
      if (derived <= cw) continue; // current week isn't over yet

      // Finalize every week that has closed since we last advanced.
      for (let wk = cw; wk < derived; wk++) {
        await finalizeWeek(supabase, lg.id, wk);
      }
      await supabase.from("leagues").update({ current_week: derived }).eq("id", lg.id);
      advanced.push({ league: lg.id, from: cw, to: derived });
    }

    return res.status(200).json({ ok: true, advanced });
  } catch (err) {
    console.error("advance error", err);
    return res.status(500).json({ error: "advance failed" });
  }
}

// Decide W/L for a closed week from graded picks.
// Idempotent: only touches matchups that haven't been finalized yet (winner_id IS NULL).
async function finalizeWeek(supabase, leagueId, week) {
  const { data: wonPicks } = await supabase
    .from("picks")
    .select("user_id, points_earned")
    .eq("league_id", leagueId)
    .eq("week", week)
    .eq("result", "W");

  const totals = {};
  (wonPicks || []).forEach((p) => {
    totals[p.user_id] = (totals[p.user_id] || 0) + parseFloat(p.points_earned || 0);
  });

  const { data: matchups } = await supabase
    .from("matchups")
    .select("id, user1_id, user2_id")
    .eq("league_id", leagueId)
    .eq("week", week)
    .is("winner_id", null);

  for (const m of matchups || []) {
    const p1 = totals[m.user1_id] || 0;
    const p2 = totals[m.user2_id] || 0;
    const winner = p1 >= p2 ? m.user1_id : m.user2_id;

    await supabase
      .from("matchups")
      .update({
        winner_id: winner,
        user1_points: parseFloat(p1.toFixed(1)),
        user2_points: parseFloat(p2.toFixed(1)),
      })
      .eq("id", m.id);

    for (const [uid, myPts, oppPts] of [
      [m.user1_id, p1, p2],
      [m.user2_id, p2, p1],
    ]) {
      await supabase
        .from("users")
        .update({
          pending_result: JSON.stringify({
            won: winner === uid,
            myPts: parseFloat(myPts.toFixed(1)),
            oppPts: parseFloat(oppPts.toFixed(1)),
            week,
          }),
        })
        .eq("id", uid);
    }
  }
}
