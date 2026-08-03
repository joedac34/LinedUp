/* Store or remove a push registration.  Place at: api/push-subscribe.js
   Handles BOTH transports:
     { subscription: {...} }              Web Push  -> push_subscriptions
     { deviceToken, environment, ... }    APNs      -> push_tokens
   The native wrap has no service worker and no PushManager, so it can only ever
   send the second shape; browsers can only ever send the first.
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
      // Scoped to user_id as well as token: without it, knowing any token would let
      // a caller unsubscribe someone else's device.
      if (body.deviceToken) await supabase.from('push_tokens').delete().eq('token', body.deviceToken).eq('user_id', userId);
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    // ── APNs (native) ──
    const { deviceToken } = body;
    if (deviceToken) {
      if (typeof deviceToken !== 'string' || !/^[0-9a-fA-F]{64,200}$/.test(deviceToken)) {
        return res.status(400).json({ error: 'bad device token' });
      }
      // A build run from Xcode gets a SANDBOX token; TestFlight and App Store builds
      // get PRODUCTION tokens. They are not interchangeable — sending to the wrong
      // host returns BadDeviceToken and delivers nothing. The client reports which
      // one it is; anything unrecognised falls back to production, since that is
      // what every shipped build will be.
      const environment = body.environment === 'sandbox' ? 'sandbox' : 'production';
      const platform = body.platform === 'android' ? 'android' : 'ios';
      await supabase.from('push_tokens').upsert(
        { token: deviceToken, user_id: userId, platform, environment,
          app_version: (body.appVersion || null), updated_at: new Date().toISOString() },
        { onConflict: 'token' }
      );
      await supabase.from('users').update({ push_enabled: true }).eq('id', userId);
      return res.status(200).json({ ok: true, transport: 'apns', environment });
    }

    // ── Web Push ──
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