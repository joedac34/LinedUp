// /api/unlock-league.js — redeem an iOS one-time purchase against ONE league.
//
// Why this endpoint exists at all:
// RevenueCat entitlements are per-USER, but a league unlock is per-LEAGUE. There
// is no entitlement that can express "this person paid for league X". So the
// client buys the non-subscription product, then calls here, and the SERVER:
//   1. asks RevenueCat what that user actually owns (never trusts the client),
//   2. finds a purchase transaction that has not been spent yet,
//   3. records it in iap_league_unlocks (primary key = transaction_id), and
//   4. flips leagues.paid for that one league.
//
// Step 3 is the whole security model. Without a consumed-transaction ledger, one
// $15 purchase could be replayed to unlock every league the user owns — the same
// class of bug as the old hardcoded isPro that gave every iOS user Pro for free.
// The primary key makes double-spend a database error rather than a policy we
// have to remember to enforce.
//
// Apple is the source of truth via RevenueCat; a refund removes the purchase from
// the subscriber record, but an already-unlocked league stays unlocked. That
// mirrors the Stripe side, where a refund re-locks only on the webhook.

import { createClient } from "@supabase/supabase-js";

const LEAGUE_PRODUCT = "com.dacunto.picklock.league.single";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth" });

  const url = process.env.VITE_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_KEY;
  const rcKey = process.env.REVENUECAT_SECRET_KEY;
  if (!url || !service) return res.status(500).json({ error: "Server not configured" });
  if (!rcKey) return res.status(500).json({ error: "REVENUECAT_SECRET_KEY not set" });

  const supabase = createClient(url, service);

  // Identify the caller from their JWT. Never accept a user id from the body.
  const { data: userData, error: authErr } = await supabase.auth.getUser(token);
  const caller = userData && userData.user;
  if (authErr || !caller) return res.status(401).json({ error: "Invalid session" });

  const { league_id } = req.body || {};
  if (!league_id) return res.status(400).json({ error: "league_id required" });

  // The caller must own the league, and it must actually need unlocking.
  const { data: lg } = await supabase
    .from("leagues").select("id, paid, commissioner_id, name")
    .eq("id", league_id).maybeSingle();
  if (!lg) return res.status(404).json({ error: "League not found" });
  if (String(lg.commissioner_id) !== String(caller.id)) {
    return res.status(403).json({ error: "Only the commissioner can unlock this league" });
  }
  if (lg.paid === true) return res.status(200).json({ ok: true, already: true });

  // Ask RevenueCat what this user owns. app_user_id is the Supabase user id
  // (see initPurchases in src/purchases.js), so the lookup is direct.
  let subscriber = null;
  try {
    const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(caller.id)}`, {
      headers: { Authorization: `Bearer ${rcKey}` },
    });
    if (!r.ok) return res.status(502).json({ error: `revenuecat_${r.status}` });
    const j = await r.json();
    subscriber = j && j.subscriber;
  } catch (e) {
    return res.status(502).json({ error: "revenuecat_unreachable" });
  }
  if (!subscriber) return res.status(502).json({ error: "revenuecat_no_subscriber" });

  // Non-subscription (one-time) purchases of the league product.
  const purchases = (subscriber.non_subscriptions && subscriber.non_subscriptions[LEAGUE_PRODUCT]) || [];
  if (!Array.isArray(purchases) || purchases.length === 0) {
    return res.status(402).json({ error: "no_purchase_found" });
  }

  // Which transactions has this user already spent?
  const ids = purchases.map((p) => String(p.id || p.store_transaction_id || "")).filter(Boolean);
  if (!ids.length) return res.status(402).json({ error: "no_transaction_ids" });

  const { data: spent } = await supabase
    .from("iap_league_unlocks").select("transaction_id").in("transaction_id", ids);
  const spentSet = new Set((spent || []).map((x) => x.transaction_id));
  const unspent = ids.find((id) => !spentSet.has(id));
  if (!unspent) return res.status(402).json({ error: "all_purchases_already_used" });

  // Claim the transaction FIRST. If two requests race, the primary key rejects
  // the loser, so a single purchase can never unlock two leagues.
  const { error: claimErr } = await supabase.from("iap_league_unlocks").insert({
    transaction_id: unspent,
    user_id: caller.id,
    league_id,
    product_id: LEAGUE_PRODUCT,
    store: "app_store",
  });
  if (claimErr) return res.status(409).json({ error: "transaction_already_claimed" });

  const { data: upd, error: updErr } = await supabase
    .from("leagues").update({ paid: true }).eq("id", league_id).select("id");
  if (updErr || !upd || !upd.length) {
    // Roll the claim back so the purchase is not burned on a failed unlock.
    await supabase.from("iap_league_unlocks").delete().eq("transaction_id", unspent);
    return res.status(500).json({ error: "unlock_failed" });
  }

  return res.status(200).json({ ok: true, league_id, transaction_id: unspent });
}
