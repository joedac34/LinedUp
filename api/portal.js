/* Create a Stripe Billing (Customer) Portal session so a Pro user can manage/cancel
   their SUBSCRIPTION.  Place at: api/portal.js
   Env: STRIPE_SECRET_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
   Frontend: POST + Authorization: Bearer <supabase access_token>. User is derived from the token.

   Note: the portal only manages subscriptions, saved cards, and invoice history — one-time
   league purchases are not subscriptions, so they can't be "cancelled" here. Nothing to gate.
   One-time setup: enable the Customer Portal in the Stripe dashboard
   (Settings → Billing → Customer portal) and allow "Cancel subscriptions". */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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

    const { data: u } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();
    if (!u || !u.stripe_customer_id) {
      return res.status(400).json({ error: 'no active subscription to manage' });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: u.stripe_customer_id,
      return_url: `${origin}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}