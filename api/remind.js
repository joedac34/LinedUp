/* Pick-lock reminder cron.  Place at: api/remind.js
   Nudges league members who still have empty slots this week, fired when the current
   week's NEXT un-started game is close (so it lands near lock time, not at week start).
   Sends through /api/notify, which honors each user's push_enabled + notif_reminder toggle.

   Auth: Authorization: Bearer <CRON_SECRET>  (same as /api/grade, /api/advance)
   Schedule on cron-job.org: every 30 min is plenty.
   Requires the notif_reminders table (see migration in the handoff).
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, CRON_SECRET */

import { createClient } from '@supabase/supabase-js';

const WINDOW_MS = 120 * 60 * 1000; // remind when the next un-started game is within 2h

export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'supabase env not set' });
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const now = Date.now();
  const base = 'https://' + (req.headers.host || process.env.VERCEL_URL || 'lined-up-murex.vercel.app');
  let remindersSent = 0;
  const detail = [];

  try {
    // In-season, non-solo leagues.
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name, current_week, slot_config, season_start, league_type')
      .not('season_start', 'is', null)
      .neq('league_type', 'solo');

    for (const lg of leagues || []) {
      try {
        const week = lg.current_week || 1;

        let slotCount = 0;
        try {
          const cfg = typeof lg.slot_config === 'string' ? JSON.parse(lg.slot_config) : lg.slot_config;
          slotCount = Array.isArray(cfg) ? cfg.length : 0;
        } catch (e) { slotCount = 0; }
        if (!slotCount) continue;

        // This week's picks → next un-started game (the imminent lock) + per-member counts.
        const { data: picks } = await supabase
          .from('picks')
          .select('user_id, game_date')
          .eq('league_id', lg.id)
          .eq('week', week);
        if (!picks || !picks.length) continue; // no game_date reference yet → skip (can't time it)

        let nextGame = Infinity;
        const countByUser = {};
        for (const p of picks) {
          countByUser[p.user_id] = (countByUser[p.user_id] || 0) + 1;
          const t = p.game_date ? Date.parse(p.game_date) : NaN;
          if (!isNaN(t) && t > now && t < nextGame) nextGame = t;
        }
        if (!isFinite(nextGame) || nextGame - now > WINDOW_MS) continue; // no lock coming up soon

        // Members with an incomplete slip.
        const { data: members } = await supabase
          .from('league_members')
          .select('user_id')
          .eq('league_id', lg.id);
        const incomplete = (members || [])
          .map((m) => m.user_id)
          .filter((uid) => (countByUser[uid] || 0) < slotCount);
        if (!incomplete.length) continue;

        // Dedupe: at most one reminder per (league, member, week). Insert = claim; conflict = already sent.
        const toRemind = [];
        for (const uid of incomplete) {
          const { error: insErr } = await supabase
            .from('notif_reminders')
            .insert({ league_id: lg.id, user_id: uid, week });
          if (!insErr) toRemind.push(uid);
        }
        if (!toRemind.length) continue;

        const lockTime = new Date(nextGame).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
        });

        const r = await fetch(base + '/api/notify', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userIds: toRemind,
            title: '\u23F0 Picks lock soon',
            body: `You still have open slots in ${lg.name || 'your league'} \u2014 first game at ${lockTime} ET.`,
            url: '/',
            category: 'notif_reminder',
          }),
        });
        let sentBody = {};
        try { sentBody = await r.json(); } catch (e) {}
        remindersSent += (sentBody && sentBody.sent) || 0;
        detail.push({ league: lg.name, week, claimed: toRemind.length, sent: (sentBody && sentBody.sent) || 0 });
      } catch (e) {
        detail.push({ league: lg && lg.name, error: String((e && e.message) || e).slice(0, 140) });
      }
    }

    return res.status(200).json({ ok: true, remindersSent, detail });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
