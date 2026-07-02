/* Store or remove a Web Push subscription.  Place at: api/push-subscribe.js
   Auth: requires a valid Supabase user access token; the user is derived from the token,
         so a subscription can only be stored/removed for the caller themselves.
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function authedUserId(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try { const { data, error } = await supabase.auth.getUser(token); if (error || !data || !data.user) return null; return data.user.id; }
  catch (e) { return null; }
}

export default async function handler(req, res) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const userId = await authedUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'DELETE') {
      if (body.endpoint) await supabase.from('push_subscriptions').delete().eq('endpoint', body.endpoint).eq('user_id', userId);
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { subscription } = body;
    if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'missing subscription' });
    await supabase.from('push_subscriptions').upsert(
      { endpoint: subscription.endpoint, user_id: userId, subscription, updated_at: new Date().toISOString() },
      { onConflict: 'endpoint' }
    );
    await supabase.from('users').update({ push_enabled: true }).eq('id', userId);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}