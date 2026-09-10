/* api/_apnsLive.js — Live Activity pushes over APNs.
 *
 * Same key, team and host as api/_apns.js; differs in three headers only:
 *   apns-push-type: liveactivity
 *   apns-topic:     <bundle>.push-type.liveactivity
 *   apns-priority:  10 (5 would let iOS coalesce updates for minutes)
 * and in the payload shape, which is Apple's for ActivityKit. Kept separate
 * from _apns.js so alert pushes cannot regress while this is new.
 *
 * Env (Vercel, already set): APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID
 */
import http2 from 'node:http2';
import crypto from 'node:crypto';

const HOSTS = {
  production: 'https://api.push.apple.com',
  sandbox: 'https://api.sandbox.push.apple.com',
};

let _jwt = null;
let _jwtAt = 0;
function providerToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_jwt && now - _jwtAt < 3000) return _jwt;
  const keyId = process.env.APNS_KEY_ID, teamId = process.env.APNS_TEAM_ID;
  let p8 = process.env.APNS_KEY_P8 || '';
  if (!keyId || !teamId || !p8) throw new Error('APNs env incomplete');
  p8 = p8.replace(/\\n/g, '\n').trim();
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64({ alg: 'ES256', kid: keyId }) + '.' + b64({ iss: teamId, iat: now });
  const sig = crypto.createSign('SHA256').update(unsigned).sign({ key: crypto.createPrivateKey(p8), dsaEncoding: 'ieee-p1363' });
  _jwt = unsigned + '.' + sig.toString('base64url');
  _jwtAt = now;
  return _jwt;
}

const BUNDLE = () => process.env.APNS_BUNDLE_ID || 'com.dacunto.picklock';

/* event: "update" | "end" (activity token) or "start" (push-to-start token).
   For "start", pass attributes + attributesType; for update/end, contentState only.
   Resolves { ok, status, reason }. Never throws. */
export function sendLiveActivity(token, { event, contentState, attributes, attributesType, dismissAt, alert }, environment = 'production') {
  return new Promise((resolve) => {
    let client;
    const done = (r) => { try { if (client && !client.destroyed) client.close(); } catch (e) {} resolve(r); };
    let jwt;
    try { jwt = providerToken(); } catch (e) { return resolve({ ok: false, status: 0, reason: String(e.message || e) }); }

    const aps = {
      timestamp: Math.floor(Date.now() / 1000),
      event,
      'content-state': contentState,
    };
    if (event === 'start') {
      aps['attributes-type'] = attributesType || 'PickLockActivityAttributes';
      aps.attributes = attributes;
      // A start needs an alert to be allowed to light up the lock screen.
      aps.alert = alert || { title: 'PickLock', body: 'Your matchup is live' };
    }
    if (event === 'end' && dismissAt) aps['dismissal-date'] = Math.floor(dismissAt / 1000);
    if (alert && event !== 'start') aps.alert = alert;

    try {
      client = http2.connect(HOSTS[environment] || HOSTS.production);
      client.on('error', (e) => done({ ok: false, status: 0, reason: String(e.message || e) }));
      const body = Buffer.from(JSON.stringify({ aps }));
      const req = client.request({
        ':method': 'POST',
        ':path': '/3/device/' + token,
        'authorization': 'bearer ' + jwt,
        'apns-topic': BUNDLE() + '.push-type.liveactivity',
        'apns-push-type': 'liveactivity',
        'apns-priority': '10',
        'content-type': 'application/json',
        'content-length': body.length,
      });
      let status = 0, data = '';
      req.on('response', (h) => { status = Number(h[':status']) || 0; });
      req.setEncoding('utf8');
      req.on('data', (c) => { data += c; });
      req.on('error', (e) => done({ ok: false, status: 0, reason: String(e.message || e) }));
      req.on('end', () => {
        let reason = null;
        if (status !== 200) { try { reason = JSON.parse(data || '{}').reason || null; } catch (e) { reason = data.slice(0, 120) || null; } }
        done({ ok: status === 200, status, reason });
      });
      req.setTimeout(8000, () => { try { req.close(); } catch (e) {} done({ ok: false, status: 0, reason: 'timeout' }); });
      req.end(body);
    } catch (e) { done({ ok: false, status: 0, reason: String(e.message || e) }); }
  });
}

export const DEAD_REASONS = new Set(['BadDeviceToken', 'Unregistered', 'DeviceTokenNotForTopic', 'ExpiredToken']);
