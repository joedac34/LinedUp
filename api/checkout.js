/* Create a Stripe Checkout Session (subscription mode).  Place at: api/checkout.js
   Env: STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY (+ optional STRIPE_PRICE_ANNUAL)
   Frontend contract (App.jsx startCheckout): POST { plan, userId, email } -> { url } */
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_BY_PLAN = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { plan, userId, email } = body;
    if (!userId) return res.status(400).json({ error: 'missing userId' });

    const priceId = PRICE_BY_PLAN[plan] || PRICE_BY_PLAN.monthly;
    if (!priceId) return res.status(500).json({ error: 'price not configured (set STRIPE_PRICE_MONTHLY)' });

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,                 // maps payment -> Supabase user
      customer_email: email || undefined,
      metadata: { userId, plan: plan || 'monthly' },
      subscription_data: { metadata: { userId } }, // so subscription.* events carry userId
      allow_promotion_codes: true,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
