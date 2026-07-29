/* Export everything PickLock holds about one account.  Place at: api/export-data.js
   Auth: POST + Authorization: Bearer <supabase access_token>. The user is derived
   from the token — a caller can only ever export themselves.
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY

   WHY A SERVER ROUTE AND NOT A CLIENT QUERY
   Row-level security decides what the browser can read, and it is tuned for the
   app's screens, not for a complete export — some of these tables the client can
   only read a filtered slice of. Running with the service key and filtering by the
   token's own user id means the export is guaranteed complete AND still scoped to
   one person. The privacy policy grants access rights under CCPA and GDPR; a
   partial export would not satisfy them.

   WHAT IS DELIBERATELY NOT INCLUDED
   Other people's picks, other people's chat messages, and internal ids that belong
   to third parties. A data-access right covers the requester's own data, not their
   league-mates'. Stripe ids are included because they are the person's own billing
   identifiers, but no card data is stored here or returned. */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function authedUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) return null;
    return data.user;
  } catch (e) { return null; }
}

// A missing or renamed table must not fail the whole export — the person still
// gets everything else, and the gap is reported in `notes`.
async function grab(table, uid, notes, column) {
  const col = column || 'user_id';
  try {
    const { data, error } = await supabase.from(table).select('*').eq(col, uid);
    if (error) { notes.push(table + ': ' + error.message); return []; }
    return data || [];
  } catch (e) {
    notes.push(table + ': unavailable');
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'supabase env not set' });
  }

  try {
    const user = await authedUser(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const uid = user.id;
    const notes = [];

    const { data: profile } = await supabase
      .from('users').select('*').eq('id', uid).maybeSingle();

    if (profile && profile.deleted_at) {
      return res.status(409).json({ error: 'account deleted' });
    }

    const [picks, memberships, messages, notifications, plok, ranks, reactions] = await Promise.all([
      grab('picks', uid, notes),
      grab('league_members', uid, notes),
      grab('league_messages', uid, notes),
      grab('notifications', uid, notes),
      grab('plok_calls', uid, notes),
      grab('weekly_ranks', uid, notes),
      grab('chat_reactions', uid, notes),
    ]);

    // Matchups need an OR — the person may be on either side.
    let matchups = [];
    try {
      const { data, error } = await supabase
        .from('matchups').select('*')
        .or('user1_id.eq.' + uid + ',user2_id.eq.' + uid);
      if (error) notes.push('matchups: ' + error.message); else matchups = data || [];
    } catch (e) { notes.push('matchups: unavailable'); }

    // League names, so the export reads as something a person can understand
    // rather than a wall of uuids.
    const leagueIds = [...new Set(memberships.map(m => m.league_id).filter(Boolean))];
    let leagues = [];
    if (leagueIds.length) {
      const { data } = await supabase
        .from('leagues').select('id,name,sport,league_type,season_start,created_at')
        .in('id', leagueIds);
      leagues = data || [];
    }
    const leagueName = (id) => (leagues.find(l => l.id === id) || {}).name || null;

    const payload = {
      export_generated_at: new Date().toISOString(),
      export_format_version: 1,
      about_this_file:
        'Everything PickLock holds about your account. Other people\'s picks and messages are not included. ' +
        'Questions: joe@picklockapp.com',

      account: profile ? {
        user_id: profile.id,
        username: profile.username,
        email: profile.email,
        created_at: profile.created_at,
        is_founder: profile.is_founder,
        founder_number: profile.founder_number,
        is_pro: profile.is_pro,
        referral_code: profile.referral_code,
        referred_by: profile.referred_by,
        push_enabled: profile.push_enabled,
        notification_preferences: {
          weekly_results: profile.notif_results,
          picks_graded: profile.notif_grades,
          pick_reminder: profile.notif_reminder,
          league_activity: profile.notif_league,
          plok: profile.notif_plok,
        },
        billing: {
          stripe_customer_id: profile.stripe_customer_id || null,
          stripe_subscription_id: profile.stripe_subscription_id || null,
          note: 'PickLock never stores card numbers. Payment details live with Stripe.',
        },
      } : null,

      leagues: memberships.map(m => ({
        league_id: m.league_id,
        league_name: leagueName(m.league_id),
        is_commissioner: m.is_commissioner,
        joined: m.created_at || null,
      })),
      league_details: leagues,

      picks,
      matchups,
      weekly_ranks: ranks,
      chat_messages: messages,
      chat_reactions: reactions,
      notifications,
      ai_history: plok,

      counts: {
        picks: picks.length,
        matchups: matchups.length,
        leagues: memberships.length,
        chat_messages: messages.length,
        notifications: notifications.length,
        ai_history: plok.length,
      },
      notes,
    };

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="picklock-data-' + stamp + '.json"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(JSON.stringify(payload, null, 2));

  } catch (e) {
    console.error('export-data: unexpected', e && e.message);
    return res.status(500).json({ error: 'Could not build your export. Please try again.' });
  }
}
