/**
 * /api/_usage.js — one-line API consumption logging for any endpoint.
 *
 * Answers "what will 3 sports and 40 users actually cost" with data instead of
 * guesses. Fire-and-forget: NEVER throws, NEVER blocks the response.
 *
 * Usage inside any api/*.js handler:
 *   import { logUsage } from "./_usage.js";
 *   logUsage("odds", { sport, upstream: oddsApiCalls, cached });
 *
 * Column notes:
 *   endpoint  - "odds" | "findbet" | "grade" | "gifs" | ...
 *   upstream  - how many PAID third-party calls this request caused (0 if cache hit)
 *   meta      - small jsonb blob (sport, market, cached, user hash, etc.)
 *
 * ENV: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

export function logUsage(endpoint, { upstream = 0, ...meta } = {}) {
  try {
    if (!SB_URL || !SB_KEY) return;
    // fire-and-forget; no await at call sites
    fetch(`${SB_URL}/rest/v1/api_usage`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ endpoint, upstream, meta }),
    }).catch(() => {});
  } catch (e) { /* never break a request over telemetry */ }
}
