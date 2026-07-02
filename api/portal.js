/* Stripe Billing Portal session.  Place at: api/portal.js
   Env: STRIPE_SECRET_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
   Frontend: POST (no body needed) + Authorization: Bearer <supabase access_token> -> { url }
   The user is derived from the auth token — a spoofed body userId can't open someone else's portal. */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function authedUserId(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try { const { data, error } = await supabase.auth.getUser(token); if (error || !data || !data.user) return null; return data.user.id; }
  catch (e) { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const userId = await authedUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { data, error } = await supabase.from('users').select('stripe_customer_id').eq('id', userId).maybeSingle();
    if (error) return res.status(500).json({ error: 'lookup_failed' });

    const customer = data && data.stripe_customer_id;
    if (!customer) return res.status(400).json({ error: 'no_customer', message: 'No Stripe customer on file for this user.' });

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.billingPortal.sessions.create({ customer, return_url: origin });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('portal error:', err);
    return res.status(500).json({ error: 'portal_failed' });
  }
}