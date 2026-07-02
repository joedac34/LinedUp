/* Create a Stripe Checkout Session (subscription mode).  Place at: api/checkout.js
   Env: STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY (+ optional STRIPE_PRICE_ANNUAL),
        VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
   Frontend contract (App.jsx startCheckout): POST { plan } + Authorization: Bearer <supabase access_token>
   The user is derived from the auth token — the request body's userId is NOT trusted. */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const PRICE_BY_PLAN = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
};

async function authedUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try { const { data, error } = await supabase.auth.getUser(token); if (error || !data || !data.user) return null; return data.user; }
  catch (e) { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const user = await authedUser(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const userId = user.id;

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { plan } = body;

    const priceId = PRICE_BY_PLAN[plan] || PRICE_BY_PLAN.monthly;
    if (!priceId) return res.status(500).json({ error: 'price not configured (set STRIPE_PRICE_MONTHLY)' });

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,                 // maps payment -> Supabase user (from the token)
      customer_email: user.email || undefined,
      metadata: { userId, plan: plan || 'monthly' },
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}