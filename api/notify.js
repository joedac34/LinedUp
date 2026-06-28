/* Send a Web Push to one or more users.  Place at: api/notify.js
   Body (both shapes accepted): { userIds:[...] | userId, title, body, url?, data?, category? }
   - Back-compatible with the old stub's { userId, title, body, data } callers.
   - category (e.g. "notif_league") is checked against the user's pref + push_enabled.
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT */
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_SUBJECT || 'admin@picklockapp.com'),
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { userIds, userId, title, body: text, url, data, category } = body;
    const ids = (userIds && userIds.length ? userIds : (userId ? [userId] : [])).filter(Boolean);
    if (!ids.length || !title) return res.status(400).json({ error: 'missing userIds/title' });

    const cols = 'id,push_enabled' + (category ? (',' + category) : '');
    const { data: users } = await supabase.from('users').select(cols).in('id', ids);
    const allowed = (users || [])
      .filter(u => u.push_enabled !== false && (!category || u[category] !== false))
      .map(u => u.id);
    if (!allowed.length) return res.status(200).json({ ok: true, sent: 0, skipped: ids.length });

    const { data: subs } = await supabase.from('push_subscriptions').select('*').in('user_id', allowed);
    const payload = JSON.stringify({ title, body: text || '', url: url || (data && data.url) || '/', tag: category || undefined });

    let sent = 0; const dead = [];
    await Promise.all((subs || []).map(async row => {
      try { await webpush.sendNotification(row.subscription, payload); sent++; }
      catch (err) { if (err.statusCode === 404 || err.statusCode === 410) dead.push(row.endpoint); }
    }));
    if (dead.length) await supabase.from('push_subscriptions').delete().in('endpoint', dead);

    return res.status(200).json({ ok: true, sent, pruned: dead.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}