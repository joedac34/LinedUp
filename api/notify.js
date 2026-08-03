/* Send a Web Push to one or more users.  Place at: api/notify.js
   Auth: either the internal server secret (Authorization: Bearer <CRON_SECRET>, used by grade.js)
         OR a valid Supabase user access token (used by the client "league is live" call).
         Anonymous callers are rejected — this closes the open push-spam/phishing vector.
   Body: { userIds:[...] | userId, title, body, url?, data?, category? }
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET
        APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID
   Two transports: Web Push (browsers + installed PWAs) and APNs (the native iOS
   wrap, where Web Push does not exist at all). Recipient selection, category
   preferences and the shared-league restriction are shared by both — only the
   final send differs. A user on both web and phone gets both, by design. */
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { sendApns, DEAD_REASONS } from './_apns.js';

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
    const { userIds, userId, title, body: text, url, data, category: rawCategory } = body;
    // `category` is concatenated into a PostgREST column list below. It arrives
    // straight from the request body, so restrict it to the real preference
    // columns rather than letting a caller name any column on `users`.
    const NOTIF_COLS = ['notif_results','notif_grades','notif_reminder','notif_league','notif_plok'];
    const category = NOTIF_COLS.includes(rawCategory) ? rawCategory : null;
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

    const [{ data: subs }, { data: toks }] = await Promise.all([
      supabase.from('push_subscriptions').select('*').in('user_id', allowed),
      supabase.from('push_tokens').select('token,environment').in('user_id', allowed),
    ]);
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

    // APNs. The aps payload shape is Apple's, not ours; `url` rides along as a
    // custom key so the tap handler can route the same way the service worker does.
    let sentIos = 0; const deadToks = []; const iosErrors = []; const flipped = [];
    const apsBody = {
      aps: {
        alert: { title: safeTitle, body: safeText || '' },
        sound: 'default',
        'thread-id': category || undefined,
      },
      url: clickUrl,
    };
    await Promise.all((toks || []).map(async row => {
      const first = row.environment === 'sandbox' ? 'sandbox' : 'production';
      let r = await sendApns(row.token, apsBody, first);

      // BadDeviceToken means "valid-looking token, wrong environment" far more often
      // than it means "dead token". The webview cannot read the aps-environment
      // entitlement, so the client's guess is a hint, not a fact: a build run from
      // Xcode mints a SANDBOX token while any build made with `npm run build` reports
      // production. Rather than make that a thing anyone has to remember, try the
      // other host once and believe the result.
      if (!r.ok && r.reason === 'BadDeviceToken') {
        const other = first === 'sandbox' ? 'production' : 'sandbox';
        const r2 = await sendApns(row.token, apsBody, other);
        if (r2.ok) {
          // Persist the correction so this costs one wasted request, once, per device
          // — not one on every send forever.
          flipped.push({ token: row.token, environment: other });
          sentIos++;
          return;
        }
        r = r2;
      }

      if (r.ok) { sentIos++; return; }
      // Only prune on reasons that mean the token is permanently invalid, and only
      // after the retry above has ruled out a mismatched environment. A 429 or a 500
      // during an Apple incident must not unsubscribe the whole beta.
      if (r.reason && DEAD_REASONS.has(r.reason)) deadToks.push(row.token);
      else iosErrors.push({ status: r.status, reason: r.reason });
    }));

    // Sequential on purpose: this fires at most once per device, ever, and a bulk
    // upsert here would need the full row shape (user_id is NOT NULL) for no gain.
    for (const f of flipped) {
      try { await supabase.from('push_tokens').update({ environment: f.environment }).eq('token', f.token); }
      catch (e) { /* a failed correction just means one more retry next send */ }
    }
    if (deadToks.length) await supabase.from('push_tokens').delete().in('token', deadToks);

    return res.status(200).json({
      ok: true,
      sent, pruned: dead.length,
      sentIos, prunedIos: deadToks.length,
      ...(flipped.length ? { envFixed: flipped.length } : {}),
      ...(errors.length ? { errors } : {}),
      ...(iosErrors.length ? { iosErrors } : {}),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}