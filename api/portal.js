/* Stripe Billing Portal session.  Place at: api/portal.js
   Env: STRIPE_SECRET_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
   Frontend contract (App.jsx "Manage subscription"): POST { userId } -> { url }
   Redirect the user to that URL; Stripe hosts cancel / update card / invoices. */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { userId } = body;
    if (!userId) return res.status(400).json({ error: 'missing userId' });

    // Look up the Stripe customer the webhook stored for this user (service role).
    const { data, error } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();
    if (error) return res.status(500).json({ error: 'lookup_failed' });

    const customer = data && data.stripe_customer_id;
    if (!customer) {
      // No subscription/customer yet — nothing to manage.
      return res.status(400).json({ error: 'no_customer', message: 'No Stripe customer on file for this user.' });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: origin,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('portal error:', err);
    return res.status(500).json({ error: 'portal_failed' });
  }
}
