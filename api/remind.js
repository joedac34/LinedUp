/* Pick-lock reminder cron.  Place at: api/remind.js
   In the final stretch of a league's current week, nudges members who still have empty
   slots — telling them how many picks are left. Sends through /api/notify, which honors
   each user's push_enabled + notif_reminder toggle. One reminder per member per week.

   Auth: Authorization: Bearer <CRON_SECRET>   (same as /api/grade, /api/advance)
   Schedule on cron-job.org: every 1-2 hours is plenty (dedup keeps it to one send).
   Requires the notif_reminders table (see migration in the handoff).
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, CRON_SECRET */

import { createClient } from '@supabase/supabase-js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WINDOW_MS = 72 * 60 * 60 * 1000; // remind within the final 72h of the week

// A parlay fills ONE slot but stores multiple leg rows (longshot_<slot>_<leg>).
// Collapse legs so a parlay counts as a single filled slot.
function slotGroup(slot) {
  const s = String(slot || '');
  return /^longshot_\d+_\d+$/.test(s) ? s.replace(/_\d+$/, '') : s;
}

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
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id, name, current_week, slot_config, season_start, league_type, completed_at')
      .not('season_start', 'is', null)
      .neq('league_type', 'solo');

    for (const lg of leagues || []) {
      try {
        if (lg.completed_at) continue; // season over — never nudge a dead league
        const week = lg.current_week || 1;

        // How long until this week ends? Only remind inside the final 72h.
        const start = Date.parse(lg.season_start);
        if (isNaN(start)) continue;
        const weekEnd = start + week * WEEK_MS;
        const msLeft = weekEnd - now;
        if (msLeft <= 0 || msLeft > WINDOW_MS) continue;

        let slotCount = 0;
        try {
          const cfg = typeof lg.slot_config === 'string' ? JSON.parse(lg.slot_config) : lg.slot_config;
          slotCount = Array.isArray(cfg) ? cfg.length : 0;
        } catch (e) { slotCount = 0; }
        if (!slotCount) continue;

        // Filled slots per member (parlay legs collapsed to one slot).
        const { data: picks } = await supabase
          .from('picks')
          .select('user_id, slot')
          .eq('league_id', lg.id)
          .eq('week', week);
        const slotsByUser = {};
        for (const p of picks || []) {
          (slotsByUser[p.user_id] = slotsByUser[p.user_id] || new Set()).add(slotGroup(p.slot));
        }

        const { data: members } = await supabase
          .from('league_members')
          .select('user_id')
          .eq('league_id', lg.id);

        const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

        // Group incomplete members by how many picks they have left, so we send one
        // notification per distinct count (each body shows that count).
        const byLeft = {};
        for (const m of members || []) {
          const filled = slotsByUser[m.user_id] ? slotsByUser[m.user_id].size : 0;
          const left = slotCount - filled;
          if (left <= 0) continue; // slip complete

          // Dedupe: claim one reminder per (league, member, week). Conflict => already sent.
          const { error: insErr } = await supabase
            .from('notif_reminders')
            .insert({ league_id: lg.id, user_id: m.user_id, week });
          if (insErr) continue;

          (byLeft[left] = byLeft[left] || []).push(m.user_id);
        }

        for (const [leftStr, uids] of Object.entries(byLeft)) {
          const left = Number(leftStr);
          const body =
            `You have ${left} pick${left > 1 ? 's' : ''} left in ${lg.name || 'your league'} \u2014 ` +
            `${daysLeft} day${daysLeft > 1 ? 's' : ''} left this week.`;
          const r = await fetch(base + '/api/notify', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.CRON_SECRET}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userIds: uids,
              title: '\u23F0 Finish your slip',
              body,
              url: '/',
              category: 'notif_reminder',
            }),
          });
          let sb = {};
          try { sb = await r.json(); } catch (e) {}
          remindersSent += (sb && sb.sent) || 0;
          detail.push({ league: lg.name, week, picksLeft: left, claimed: uids.length, sent: (sb && sb.sent) || 0 });
        }
      } catch (e) {
        detail.push({ league: lg && lg.name, error: String((e && e.message) || e).slice(0, 140) });
      }
    }

    return res.status(200).json({ ok: true, remindersSent, detail });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}