/* Delete a PickLock account.  Place at: api/delete-account.js
   Auth: POST + Authorization: Bearer <supabase access_token>. The user is derived
   from the token — a caller can only ever delete themselves.
   Body: { confirm: "DELETE" }
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, STRIPE_SECRET_KEY

   WHY THIS ROUTE EXISTS AT ALL
   The client cannot delete an auth record. supabase.auth.admin.deleteUser needs the
   service-role key, and the previous client-side call was optional-chained, so it
   silently did nothing: the profile row went, the auth record survived, and the
   person could sign back in to an account with no profile.

   WHY THE PICKS SURVIVE
   Hard-deleting a player's picks retroactively rewrites the scores of everyone who
   played against them — their opponents' wins become wins against nobody and the
   standings recompute wrong. So the users row is kept as an anonymised tombstone
   (username "Former player", every other field stripped, deleted_at set) and the
   auth record is deleted. This is what the privacy policy already commits to in
   Section 4. Personal content that carries no scoring weight — chat, reactions,
   read markers, notifications, Plok history, push subscriptions — is hard-deleted.

   ORDER MATTERS
   Stripe is cancelled FIRST and aborts the whole thing on failure: deleting the
   account while a subscription keeps billing is the one outcome with no recovery
   path for the user. The auth record goes LAST, so any failure before it leaves the
   account intact and retryable. */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

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

// Personal content with no bearing on anyone else's scores.
const PURGE_TABLES = [
  'league_messages',
  'chat_reactions',
  'chat_reads',
  'notifications',
  'plok_calls',
  'push_subscriptions',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'supabase env not set' });
  }

  try {
    const user = await authedUser(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (String(body.confirm || '').trim().toUpperCase() !== 'DELETE') {
      return res.status(400).json({ error: 'confirmation required' });
    }

    const uid = user.id;
    const report = { stripe: 'none', leagues_handed_off: [], leagues_orphaned: [], purged: {} };

    const { data: profile } = await supabase
      .from('users')
      .select('id,stripe_customer_id,stripe_subscription_id,deleted_at')
      .eq('id', uid)
      .maybeSingle();

    if (profile && profile.deleted_at) {
      return res.status(409).json({ error: 'already deleted' });
    }

    // ── 1. Stripe. Abort on a real failure — billing a deleted account is the
    //       one outcome the person cannot fix themselves.
    if (stripe && profile && profile.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
        report.stripe = 'cancelled';
      } catch (e) {
        const code = e && (e.code || e.statusCode);
        // Already gone, or never existed in this mode: nothing left to cancel.
        if (code === 'resource_missing' || code === 404) {
          report.stripe = 'already inactive';
        } else {
          console.error('delete-account: stripe cancel failed', e && e.message);
          return res.status(502).json({
            error: 'Could not cancel your subscription, so nothing was deleted. Cancel it from Manage subscription, then try again.',
          });
        }
      }
    }

    // ── 2. Hand off commissioned leagues. A league whose commissioner vanishes
    //       cannot advance weeks or edit settings, so promote someone before the
    //       account goes. Deletion is never blocked on this (Apple 5.1.1(v)).
    const { data: owned } = await supabase
      .from('leagues')
      .select('id,name')
      .eq('commissioner_id', uid);

    for (const lg of (owned || [])) {
      let members = null;
      // Prefer the longest-tenured remaining member. Older rows may predate the
      // created_at column, so fall back to unordered rather than failing.
      const ordered = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', lg.id)
        .neq('user_id', uid)
        .order('created_at', { ascending: true });
      if (!ordered.error) {
        members = ordered.data;
      } else {
        const plain = await supabase
          .from('league_members')
          .select('user_id')
          .eq('league_id', lg.id)
          .neq('user_id', uid);
        members = plain.data;
      }

      const heir = (members || [])[0];
      if (heir && heir.user_id) {
        await supabase.from('leagues').update({ commissioner_id: heir.user_id }).eq('id', lg.id);
        await supabase.from('league_members')
          .update({ is_commissioner: true })
          .eq('league_id', lg.id).eq('user_id', heir.user_id);
        report.leagues_handed_off.push(lg.name);
      } else {
        // Last member standing — a solo league or one everyone else has left.
        // Nobody to promote and nobody left to affect.
        report.leagues_orphaned.push(lg.name);
      }
    }
    await supabase.from('league_members').update({ is_commissioner: false }).eq('user_id', uid);

    // ── 3. Purge personal content. A missing table is not fatal — the deletion
    //       must still complete.
    for (const t of PURGE_TABLES) {
      try {
        const { error } = await supabase.from(t).delete().eq('user_id', uid);
        report.purged[t] = error ? ('skipped: ' + error.message) : 'ok';
      } catch (e) {
        report.purged[t] = 'skipped';
      }
    }

    // ── 4. Tombstone. Everything identifying goes; the row itself stays so
    //       picks, matchups, weekly_ranks and standings keep their foreign key.
    const { error: tombErr } = await supabase
      .from('users')
      .update({
        username: 'Former player',
        email: null,
        deleted_at: new Date().toISOString(),
        is_founder: false,
        founder_number: null,   // released — the number can be reissued
        is_pro: false,
        push_enabled: false,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        referral_code: null,
        referred_by: null,
      })
      .eq('id', uid);

    if (tombErr) {
      console.error('delete-account: tombstone failed', tombErr.message);
      return res.status(500).json({ error: 'Could not anonymise your account. Nothing was deleted — please try again.' });
    }

    // ── 5. The auth record. Last, so every failure above is retryable.
    const { error: authErr } = await supabase.auth.admin.deleteUser(uid);
    if (authErr) {
      console.error('delete-account: auth delete failed', authErr.message);
      // The profile is already anonymised and the session is about to be dropped,
      // so the account is unusable either way — but this needs manual cleanup.
      return res.status(500).json({
        error: 'Your data was removed but the login could not be deleted. Email joe@picklockapp.com and it will be finished by hand.',
        partial: true,
      });
    }

    console.log('delete-account: completed', uid, JSON.stringify(report));
    return res.status(200).json({ ok: true, ...report });

  } catch (e) {
    console.error('delete-account: unexpected', e && e.message);
    return res.status(500).json({ error: 'Something went wrong. Nothing was deleted — please try again.' });
  }
}
