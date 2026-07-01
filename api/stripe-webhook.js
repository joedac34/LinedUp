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

async function setProById(userId, isPro, extra = {}) {
  if (!userId) return;
  await supabase.from('users').update({ is_pro: isPro, ...extra }).eq('id', userId);
}

// Fallback when an event has no userId in metadata: match on stored customer id.
async function setProByCustomer(customerId, isPro, subId) {
  if (!customerId) return;
  const { data } = await supabase.from('users').select('id').eq('stripe_customer_id', customerId).maybeSingle();
  if (data && data.id) {
    await supabase.from('users').update({ is_pro: isPro, stripe_subscription_id: subId || null }).eq('id', data.id);
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
      default:
        break; // ignore other event types
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
