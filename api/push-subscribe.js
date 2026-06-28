/* Store or remove a Web Push subscription.  Place at: api/push-subscribe.js
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY  (match your other api/*.js names) */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (req.method === 'DELETE') {
      if (body.endpoint) await supabase.from('push_subscriptions').delete().eq('endpoint', body.endpoint);
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const { userId, subscription } = body;
    if (!userId || !subscription || !subscription.endpoint) return res.status(400).json({ error: 'missing userId/subscription' });
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
