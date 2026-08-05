/* RevenueCat webhook -> flips users.is_pro in Supabase.  Place at: api/revenuecat-webhook.js
   Env: REVENUECAT_WEBHOOK_SECRET, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY

   In the RevenueCat dashboard: Integrations -> Webhooks -> add
     URL:            https://app.picklockapp.com/api/revenuecat-webhook
     Authorization:  the exact value of REVENUECAT_WEBHOOK_SECRET
   RevenueCat sends that string verbatim in the Authorization header. There is no
   signature scheme like Stripe's, so the shared secret IS the authentication —
   it must be long and random, and the endpoint must reject anything else.

   app_user_id is the Supabase user id, because purchases.js configures the SDK
   with appUserID = supabase user id. If that ever changes, this breaks. */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const PRO_ENTITLEMENT = 'pro';

// Events that mean "this user should have Pro right now".
const GRANT = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',   // monthly <-> annual crossgrade
  'TEMPORARY_ENTITLEMENT_GRANT',
]);

// Events that mean access has actually ended.
// NOTE: CANCELLATION is deliberately NOT here. In RevenueCat, CANCELLATION means
// the user switched off auto-renew — they keep access until the period ends, and
// EXPIRATION fires then. Revoking on CANCELLATION would cut off people who have
// already paid through the end of the month.
// BILLING_ISSUE is also excluded: Apple retries during a grace period.
const REVOKE = new Set([
  'EXPIRATION',
  'SUBSCRIPTION_PAUSED',
]);

/* Grants MUST NOT fail silently. A Supabase update that matches zero rows is not
   an error in postgrest — it returns success with an empty set. That is exactly how
   a missing public.users row let paid subscriptions go ungranted without a trace.
   Throwing here produces a non-2xx, which makes RevenueCat retry and surfaces the
   failure in the webhook delivery log instead of burying it. */
async function grantPro(userId) {
  if (!userId) throw new Error('grantPro called with no app_user_id');
  const { data, error } = await supabase
    .from('users')
    .update({ is_pro: true })
    .eq('id', userId)
    .select('id');
  if (error) throw new Error(`grantPro failed for ${userId}: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(`grantPro matched no users row for ${userId} — entitlement NOT granted`);
  }
}

/* Revoking is the dangerous direction. A user can hold Pro from Stripe on the web
   AND have a lapsed Apple subscription — letting Apple's EXPIRATION clear is_pro
   would strip access they are still paying for. So only revoke when there is no
   Stripe subscription on the row. */
async function revokePro(userId) {
  if (!userId) return;
  const { data } = await supabase
    .from('users')
    .select('id,stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return;
  if (data.stripe_subscription_id) return; // still paying via Stripe — leave alone
  await supabase.from('users').update({ is_pro: false }).eq('id', userId);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: 'webhook secret not configured' });
  if (req.headers.authorization !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const event = req.body && req.body.event;
  if (!event || !event.type) return res.status(400).json({ error: 'no event in body' });

  try {
    const type = event.type;
    const userId = event.app_user_id || null;

    // Account transfers: entitlements move between app user ids.
    if (type === 'TRANSFER') {
      for (const id of event.transferred_from || []) await revokePro(id);
      for (const id of event.transferred_to || []) await grantPro(id);
      return res.status(200).json({ received: true });
    }

    // Consumables (buy-a-league) do not touch Pro. Not wired up for iOS yet;
    // when it ships, flip leagues.paid here the way the Stripe webhook does.
    if (type === 'NON_RENEWING_PURCHASE') {
      return res.status(200).json({ received: true, ignored: 'non-renewing' });
    }

    // Only react to events that concern the Pro entitlement.
    const ents = event.entitlement_ids || (event.entitlement_id ? [event.entitlement_id] : []);
    if (ents.length && !ents.includes(PRO_ENTITLEMENT)) {
      return res.status(200).json({ received: true, ignored: 'other entitlement' });
    }

    if (GRANT.has(type)) await grantPro(userId);
    else if (REVOKE.has(type)) await revokePro(userId);
    // Everything else (CANCELLATION, BILLING_ISSUE, TEST, SUBSCRIBER_ALIAS,
    // REFUND_REVERSED, etc.) is acknowledged without changing access.

    return res.status(200).json({ received: true });
  } catch (e) {
    // Non-2xx makes RevenueCat retry, which is what we want on a transient failure.
    return res.status(500).json({ error: e.message });
  }
}