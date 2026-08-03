/* api/_apns.js — send a notification to APNs.
 *
 * Why not fetch(): APNs is HTTP/2 only. Node's global fetch speaks HTTP/1.1, so it
 * cannot talk to Apple at all. This uses node:http2 directly.
 *
 * Why not node-apn: it is unmaintained and keeps a long-lived connection pool, which
 * is the wrong shape for a serverless function that may be frozen between requests.
 * One session per invocation, closed when done, is simpler and predictable.
 *
 * Env (Vercel):
 *   APNS_KEY_P8    the full contents of the .p8, including BEGIN/END lines
 *   APNS_KEY_ID    10-char Key ID from the Apple Developer Keys page
 *   APNS_TEAM_ID   10-char Team ID (LUTFHVP5VR)
 *   APNS_BUNDLE_ID com.dacunto.picklock
 */
import http2 from 'node:http2';
import crypto from 'node:crypto';

const HOSTS = {
  production: 'https://api.push.apple.com',
  sandbox: 'https://api.sandbox.push.apple.com',
};

// APNs accepts a provider token for 1 hour and rejects anything older than that, but
// it also rate-limits token *generation* — regenerating on every send earns a 429
// (TooManyProviderTokenUpdates). Cached per warm lambda, refreshed at 50 minutes.
let _jwt = null;
let _jwtAt = 0;

function providerToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_jwt && now - _jwtAt < 3000) return _jwt;

  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  let p8 = process.env.APNS_KEY_P8 || '';
  if (!keyId || !teamId || !p8) throw new Error('APNs env incomplete');

  // Vercel's env UI turns real newlines into "\n" on paste. Restore them or the
  // PEM parse fails with an opaque "unsupported" error.
  p8 = p8.replace(/\\n/g, '\n').trim();

  const header = { alg: 'ES256', kid: keyId };
  const claims = { iss: teamId, iat: now };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64(header) + '.' + b64(claims);

  // APNs wants JOSE-format ES256 (raw r||s), not the DER that Node emits by default.
  const sig = crypto.createSign('SHA256').update(unsigned).sign({
    key: crypto.createPrivateKey(p8),
    dsaEncoding: 'ieee-p1363',
  });

  _jwt = unsigned + '.' + sig.toString('base64url');
  _jwtAt = now;
  return _jwt;
}

/* Send one notification.
   Resolves { ok, status, reason, token }. Never throws — a push failure must not
   take down the request that triggered it. */
export function sendApns(token, payload, environment = 'production') {
  return new Promise((resolve) => {
    let client;
    const done = (r) => {
      try { if (client && !client.destroyed) client.close(); } catch (e) {}
      resolve(r);
    };

    let jwt;
    try { jwt = providerToken(); }
    catch (e) { return resolve({ ok: false, status: 0, reason: String(e.message || e), token }); }

    try {
      client = http2.connect(HOSTS[environment] || HOSTS.production);
      client.on('error', (e) => done({ ok: false, status: 0, reason: String(e.message || e), token }));

      const body = Buffer.from(JSON.stringify(payload));
      const req = client.request({
        ':method': 'POST',
        ':path': '/3/device/' + token,
        'authorization': 'bearer ' + jwt,
        'apns-topic': process.env.APNS_BUNDLE_ID || 'com.dacunto.picklock',
        'apns-push-type': 'alert',
        // 10 = deliver immediately. 5 would let iOS batch it for power, which is
        // wrong for a pick-lock reminder where the whole value is the timing.
        'apns-priority': '10',
        'content-type': 'application/json',
        'content-length': body.length,
      });

      let status = 0;
      let data = '';
      req.on('response', (h) => { status = Number(h[':status']) || 0; });
      req.setEncoding('utf8');
      req.on('data', (c) => { data += c; });
      req.on('error', (e) => done({ ok: false, status: 0, reason: String(e.message || e), token }));
      req.on('end', () => {
        let reason = null;
        if (status !== 200) {
          try { reason = JSON.parse(data || '{}').reason || null; } catch (e) { reason = data.slice(0, 120) || null; }
        }
        done({ ok: status === 200, status, reason, token });
      });

      req.setTimeout(8000, () => { try { req.close(); } catch (e) {} done({ ok: false, status: 0, reason: 'timeout', token }); });
      req.end(body);
    } catch (e) {
      done({ ok: false, status: 0, reason: String(e.message || e), token });
    }
  });
}

/* Reasons that mean the token is permanently dead and should be deleted.
   Anything else (429, 500, timeout) is transient — deleting on those would
   silently unsubscribe people during an Apple outage. */
export const DEAD_REASONS = new Set([
  'BadDeviceToken',
  'Unregistered',
  'DeviceTokenNotForTopic',
  'ExpiredToken',
]);

export default sendApns;
