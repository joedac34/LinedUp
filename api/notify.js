/**
 * /api/notify.js
 * Push notification sender — stub ready for OneSignal or APNs.
 * Currently logs only. When ready to activate:
 *   1. Sign up at onesignal.com, create an iOS app
 *   2. Add ONESIGNAL_APP_ID and ONESIGNAL_API_KEY to Vercel env vars
 *   3. Uncomment the OneSignal block below
 */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, title, body, data } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ error: "Missing userId, title, or body" });
  }

  // ── Fetch user's push token from Supabase ──
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // service role key (not anon)

  let pushToken = null;
  let pushEnabled = true;

  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=push_token,push_enabled`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    const users = await r.json();
    pushToken   = users?.[0]?.push_token;
    pushEnabled = users?.[0]?.push_enabled !== false;
  } catch (e) {
    console.error("Failed to fetch push token:", e);
    return res.status(500).json({ error: "Failed to fetch user" });
  }

  if (!pushEnabled) {
    return res.status(200).json({ skipped: true, reason: "User has push disabled" });
  }

  if (!pushToken) {
    // Token not registered yet — log and succeed silently
    console.log(`[notify] No push token for user ${userId} — skipping`);
    return res.status(200).json({ skipped: true, reason: "No push token" });
  }

  // ── OneSignal (uncomment when ready) ──
  /*
  const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
  const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    include_external_user_ids: [userId],
    headings:  { en: title },
    contents:  { en: body },
    data:      data || {},
    ios_badgeType: "Increase",
    ios_badgeCount: 1,
  };

  const notifRes = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const notifData = await notifRes.json();
  if (notifData.errors) {
    console.error("[notify] OneSignal error:", notifData.errors);
    return res.status(500).json({ error: "OneSignal error", details: notifData.errors });
  }

  return res.status(200).json({ sent: true, id: notifData.id });
  */

  // ── Stub: just log for now ──
  console.log(`[notify] STUB — would send to ${userId}: "${title}" / "${body}"`);
  return res.status(200).json({ sent: false, stub: true, userId, title, body });
}