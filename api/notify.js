/* Send a Web Push to one or more users.  Place at: api/notify.js
   Auth: either the internal server secret (Authorization: Bearer <CRON_SECRET>, used by grade.js)
         OR a valid Supabase user access token (used by the client "league is live" call).
         Anonymous callers are rejected — this closes the open push-spam/phishing vector.
   Body: { userIds:[...] | userId, title, body, url?, data?, category? }
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET */
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const _vsubj = process.env.VAPID_SUBJECT || 'admin@picklockapp.com';
webpush.setVapidDetails(
  (_vsubj.startsWith('mailto:') || _vsubj.startsWith('http')) ? _vsubj : ('mailto:' + _vsubj),
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
    const authHeader = req.headers.authorization || '';
    const isInternal = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    let caller = null;
    if (!isInternal) {
      caller = await authedUser(req);
      if (!caller) return res.status(401).json({ error: 'unauthorized' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { userIds, userId, title, body: text, url, data, category } = body;
    let ids = (userIds && userIds.length ? userIds : (userId ? [userId] : [])).filter(Boolean);
    if (!ids.length || !title) return res.status(400).json({ error: 'missing userIds/title' });

    // Internal (cron) callers are trusted. A regular logged-in caller may ONLY push
    // to people who share a league with them, and the click-through is forced
    // internal — this closes the arbitrary-recipient push spam / phishing vector.
    let clickUrl = url || (data && data.url) || '/';
    let safeTitle = title, safeText = text;
    if (!isInternal) {
      const { data: myL } = await supabase.from('league_members').select('league_id').eq('user_id', caller.id);
      const lids = (myL || []).map(r => r.league_id);
      const co = new Set([caller.id]);
      if (lids.length) {
        const { data: peers } = await supabase.from('league_members').select('user_id').in('league_id', lids);
        (peers || []).forEach(p => co.add(p.user_id));
      }
      ids = ids.filter(id => co.has(id));
      clickUrl = '/';
      safeTitle = String(title || '').slice(0, 120);
      safeText = String(text || '').slice(0, 240);
      if (!ids.length) return res.status(200).json({ ok: true, sent: 0, skipped: 'no shared-league recipients' });
    }

    const cols = 'id,push_enabled' + (category ? (',' + category) : '');
    const { data: users } = await supabase.from('users').select(cols).in('id', ids);
    const allowed = (users || [])
      .filter(u => u.push_enabled !== false && (!category || u[category] !== false))
      .map(u => u.id);
    if (!allowed.length) return res.status(200).json({ ok: true, sent: 0, skipped: ids.length });

    const { data: subs } = await supabase.from('push_subscriptions').select('*').in('user_id', allowed);
    const payload = JSON.stringify({ title: safeTitle, body: safeText || '', url: clickUrl, tag: category || undefined });

    let sent = 0; const dead = []; const errors = [];
    await Promise.all((subs || []).map(async row => {
      try { await webpush.sendNotification(row.subscription, payload); sent++; }
      catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(row.endpoint);
        else errors.push({ status: err.statusCode || null, msg: String(err.body || err.message || err).slice(0, 200) });
      }
    }));
    if (dead.length) await supabase.from('push_subscriptions').delete().in('endpoint', dead);

    return res.status(200).json({ ok: true, sent, pruned: dead.length, ...(errors.length ? { errors } : {}) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}