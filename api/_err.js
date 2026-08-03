// api/_err.js — server-side error capture.
//
// Vercel serverless functions have no ErrorBoundary and no browser. A throw in
// grade.js or odds.js currently vanishes into the Vercel log stream, which nobody
// reads until something is already visibly wrong. This posts the same $exception
// event shape the frontend uses, so both halves of the app land in one PostHog view.
//
// Fire-and-forget by design: reporting must never delay or fail the response the
// user is waiting on. Every call is wrapped and every failure is swallowed.
//
// Usage in any api/*.js:
//   import { logErr } from "./_err.js";
//   ...
//   } catch (e) {
//     logErr(e, { route: "grade", gamePk, sport });
//     return res.status(500).json({ error: "Grading failed" });
//   }

const PH_HOST = "https://us.i.posthog.com";
const PH_KEY = "phc_ttRQobQ8V6qoENHvehxX64SuQFCctjXfyHhnDRqak2h6";

// Same dedupe posture as the client. A cron hitting /api/grade every minute with a
// persistently broken upstream would otherwise emit 1,440 identical events a day.
// Lambdas are recycled often so this is best-effort per warm instance, not global.
const _seen = new Map();
const WINDOW_MS = 60000;
const MAX_TRACKED = 200;

function errText(e) {
  try {
    if (e == null) return "(no error object)";
    if (typeof e === "string") return e;
    const bits = [];
    if (e.name) bits.push(e.name);
    if (e.message) bits.push(e.message);
    if (e.status) bits.push("status=" + e.status);
    if (e.code) bits.push("code=" + e.code);
    if (!bits.length) {
      try { return JSON.stringify(e) || String(e); } catch (_) { return String(e); }
    }
    return bits.join(" | ");
  } catch (_) { return "(unprintable error)"; }
}

export function logErr(err, ctx) {
  try {
    const msg = errText(err);
    const route = (ctx && ctx.route) || "unknown";

    // Always log locally — this works even if the PostHog post fails, and keeps
    // `vercel logs` useful as the fallback surface.
    try { console.error("[picklock:" + route + "]", msg, ctx ? JSON.stringify(ctx) : ""); } catch (e) {}

    const key = route + "|" + String(msg).slice(0, 180);
    const now = Date.now();
    if (_seen.has(key) && now - _seen.get(key) < WINDOW_MS) return;
    if (_seen.size > MAX_TRACKED) _seen.clear();
    _seen.set(key, now);

    const body = JSON.stringify({
      api_key: PH_KEY,
      event: "$exception",
      // No user context server-side, so bucket by route. Passing a real user_id in
      // ctx.distinct_id ties the error to a person when the route knows one.
      distinct_id: (ctx && ctx.distinct_id) || ("server:" + route),
      properties: Object.assign({
        $exception_message: String(msg).slice(0, 500),
        $exception_type: (err && err.name) || "ServerError",
        $exception_stack_trace_raw: (err && err.stack) ? String(err.stack).slice(0, 4000) : null,
        side: "server",
      }, ctx || {}),
      timestamp: new Date().toISOString(),
    });

    // Not awaited: a slow analytics endpoint must not hold the response open.
    fetch(PH_HOST + "/i/v0/e/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {});
  } catch (e) { /* reporting must never throw */ }
}

export default logErr;
