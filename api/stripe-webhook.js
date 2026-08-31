/* Stripe webhook -> flips users.is_pro in Supabase.  Place at: api/stripe-webhook.js
   Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
   IMPORTANT: signature check needs the RAW body, so bodyParser is disabled below.
   In the Stripe dashboard, point the webhook at:  https://<your-domain>/api/stripe-webhook
   and subscribe to: checkout.session.completed, customer.subscription.updated,
   customer.subscription.deleted */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Vercel parses JSON by default; disable so we can verify the raw signature.
export const config = { api: { bodyParser: false } };

async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

/* A postgrest update that matches zero rows returns success with an empty set —
   it is not an error. That is how a missing public.users row let paid subscriptions
   go ungranted silently. So grants throw when nothing was written, which returns a
   non-2xx and makes Stripe retry the event instead of marking it delivered.
   Revocations are allowed to no-op: if the row is already gone there is nothing to
   take away, and throwing would make Stripe retry a cancellation forever. */
async function setProById(userId, isPro, extra = {}) {
  if (!userId) {
    if (isPro) throw new Error('setProById called with no userId on a grant');
    return;
  }
  const { data, error } = await supabase
    .from('users')
    .update({ is_pro: isPro, ...extra })
    .eq('id', userId)
    .select('id');
  if (error) throw new Error(`setProById failed for ${userId}: ${error.message}`);
  if (isPro && (!data || data.length === 0)) {
    throw new Error(`setProById matched no users row for ${userId} — Pro NOT granted`);
  }
}

// Fallback when an event has no userId in metadata: match on stored customer id.
async function setProByCustomer(customerId, isPro, subId) {
  if (!customerId) {
    if (isPro) throw new Error('setProByCustomer called with no customerId on a grant');
    return;
  }
  const { data } = await supabase.from('users').select('id').eq('stripe_customer_id', customerId).maybeSingle();
  if (!data || !data.id) {
    if (isPro) throw new Error(`no users row for stripe_customer_id ${customerId} — Pro NOT granted`);
    return;
  }
  const { data: updated, error } = await supabase
    .from('users')
    .update({ is_pro: isPro, stripe_subscription_id: subId || null })
    .eq('id', data.id)
    .select('id');
  if (error) throw new Error(`setProByCustomer failed for ${customerId}: ${error.message}`);
  if (isPro && (!updated || updated.length === 0)) {
    throw new Error(`update matched no row for ${data.id} — Pro NOT granted`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let event;
  try {
    const raw = await readRaw(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).json({ error: `signature verification failed: ${e.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        // À-la-carte one-time league unlock: flip that league to paid; do NOT set is_pro.
        if (s.metadata && s.metadata.kind === 'league') {
          const leagueId = s.metadata.leagueId;
          if (leagueId) {
            const { data: lg, error: lgErr } = await supabase
              .from('leagues')
              // Store the payment_intent so a later charge.refunded can find its
              // way back to THIS league. The refund event carries a charge, not
              // our metadata, so without this there is no reverse lookup.
              .update({ paid: true, stripe_payment_intent: s.payment_intent || null })
              .eq('id', leagueId).select('id');
            if (lgErr) throw new Error(`league unlock failed for ${leagueId}: ${lgErr.message}`);
            if (!lg || lg.length === 0) throw new Error(`league unlock matched no row for ${leagueId}`);
          }
          break;
        }
        // Subscription checkout: grant Pro.
        const userId = s.client_reference_id || (s.metadata && s.metadata.userId);
        await setProById(userId, true, {
          stripe_customer_id: s.customer || null,
          stripe_subscription_id: s.subscription || null,
        });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata && sub.metadata.userId;
        const active = ['active', 'trialing'].includes(sub.status);
        if (userId) await setProById(userId, active, { stripe_subscription_id: sub.id });
        else await setProByCustomer(sub.customer, active, sub.id);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata && sub.metadata.userId;
        if (userId) await setProById(userId, false);
        else await setProByCustomer(sub.customer, false, sub.id);
        break;
      }
      // ── Refunds ──────────────────────────────────────────────────────────
      // Until now this event was not handled at all, so a refunded league stayed
      // unlocked forever and a refunded subscription kept Pro. Stripe is live, so
      // that was real exposure, not a hypothetical.
      //
      // Policy: a refund revokes what it paid for. Partial refunds are IGNORED —
      // only a full refund revokes, so a goodwill partial credit does not silently
      // lock someone out of their season.
      //
      // NOTE for league unlocks: revoking re-locks the league for EVERY member,
      // not just the commissioner who refunded. At current scale that is the
      // honest default and rare enough to handle by hand; if it ever fires on a
      // populated mid-season league, expect a support conversation.
      case 'charge.refunded': {
        const ch = event.data.object;
        if (!ch || ch.refunded !== true) break;   // partial refund: leave access intact
        const pi = ch.payment_intent || null;

        // One-time league unlock -> re-lock that league only.
        if (pi) {
          const { data: lgs, error: lgErr } = await supabase
            .from('leagues').update({ paid: false }).eq('stripe_payment_intent', pi).select('id');
          if (lgErr) throw new Error(`league re-lock failed for ${pi}: ${lgErr.message}`);
          if (lgs && lgs.length) break;           // it was a league purchase; done
        }

        // Otherwise treat it as a subscription refund -> drop Pro for that customer.
        if (ch.customer) await setProByCustomer(ch.customer, false, null);
        break;
      }
      default:
        break; // ignore other event types
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}