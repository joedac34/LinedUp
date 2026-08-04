// purchases.js — RevenueCat client for PickLock (Capacitor / iOS)
//
// Design rule: RevenueCat is a WRITER, not the source of truth.
// Supabase `is_pro` stays the single source of truth. Stripe writes to it
// from the web, RevenueCat writes to it from iOS. The app only ever reads it.

import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

const RC_IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY;
const PRO_ENTITLEMENT = 'pro';

export const isNative = () => Capacitor.isNativePlatform();

/**
 * Call once, AFTER the Supabase session is known.
 * Passing the Supabase user id as appUserID is what lets a user who
 * subscribed on the web and a user who subscribed on iOS resolve to the
 * same person. Never let RevenueCat generate an anonymous id for a
 * logged-in user.
 */
export async function initPurchases(supabaseUserId) {
  if (!isNative() || !supabaseUserId) return false;

  try {
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }
    await Purchases.configure({
      apiKey: RC_IOS_API_KEY,
      appUserID: supabaseUserId,
    });
    return true;
  } catch (err) {
    console.error('[rc] configure failed', err);
    return false;
  }
}

/** Call on sign-out so the next user doesn't inherit entitlements. */
export async function logOutPurchases() {
  if (!isNative()) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    // Throws if the current user is already anonymous — safe to ignore.
    console.warn('[rc] logOut', err);
  }
}

/** Returns the packages in the `default` offering, or [] if unavailable. */
export async function getProPackages() {
  if (!isNative()) return [];

  try {
    const { current } = await Purchases.getOfferings();
    if (!current) {
      console.warn('[rc] no current offering — check products + certificate');
      return [];
    }
    return current.availablePackages ?? [];
  } catch (err) {
    console.error('[rc] getOfferings failed', err);
    return [];
  }
}

/**
 * Purchase a package. Returns { ok, cancelled, isPro }.
 * Treat user cancellation as a non-error — do not surface an alert for it.
 */
export async function purchasePro(pkg) {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return {
      ok: true,
      cancelled: false,
      isPro: hasProEntitlement(customerInfo),
    };
  } catch (err) {
    if (err?.code === 'PURCHASE_CANCELLED' || err?.userCancelled) {
      return { ok: false, cancelled: true, isPro: false };
    }
    console.error('[rc] purchase failed', err);
    return { ok: false, cancelled: false, isPro: false, error: err };
  }
}

/** Apple requires a visible Restore Purchases control. Wire this to it. */
export async function restorePurchases() {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return { ok: true, isPro: hasProEntitlement(customerInfo) };
  } catch (err) {
    console.error('[rc] restore failed', err);
    return { ok: false, isPro: false, error: err };
  }
}

/** Current entitlement state straight from the SDK cache. */
export async function checkProStatus() {
  if (!isNative()) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return hasProEntitlement(customerInfo);
  } catch (err) {
    console.error('[rc] getCustomerInfo failed', err);
    return false;
  }
}

/**
 * Fires on renewals, expirations, and cross-device changes while the app
 * is open. Use it to refresh UI — not to grant access on its own.
 */
export async function onProStatusChange(handler) {
  if (!isNative()) return;
  await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    handler(hasProEntitlement(customerInfo));
  });
}

function hasProEntitlement(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT]);
}
