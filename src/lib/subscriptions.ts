import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from "react-native-purchases";

import { supabase } from "@/lib/supabase";

const revenueCatAppleApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const revenueCatGoogleApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const entitlementId = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "pro";

let configuredUserId: string | null = null;

export type SubscriptionStatus = {
  isConfigured: boolean;
  isPro: boolean;
  entitlementId: string;
  customerInfo: CustomerInfo | null;
};

function getRevenueCatApiKey() {
  if (Platform.OS === "ios") return revenueCatAppleApiKey;
  if (Platform.OS === "android") return revenueCatGoogleApiKey;

  return revenueCatAppleApiKey ?? revenueCatGoogleApiKey;
}

export function getSubscriptionEntitlementId() {
  return entitlementId;
}

export async function configureSubscriptions(userId?: string) {
  const apiKey = getRevenueCatApiKey();

  if (!apiKey) {
    return false;
  }

  if (configuredUserId === userId) {
    return true;
  }

  await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey, appUserID: userId });
  configuredUserId = userId ?? null;

  return true;
}

export function hasActiveSubscription(customerInfo: CustomerInfo | null) {
  return Boolean(customerInfo?.entitlements.active[entitlementId]);
}

async function persistSubscriptionStatus(customerInfo: CustomerInfo | null, userId?: string) {
  if (!userId) return;

  const activeEntitlements = customerInfo ? Object.keys(customerInfo.entitlements.active) : [];
  const { error } = await supabase.from("user_subscription_status").upsert(
    {
      user_id: userId,
      entitlement_id: entitlementId,
      is_pro: activeEntitlements.includes(entitlementId),
      revenuecat_app_user_id: customerInfo?.originalAppUserId ?? userId,
      active_entitlements: activeEntitlements,
      latest_customer_info: customerInfo ? JSON.parse(JSON.stringify(customerInfo)) : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.warn("Failed to persist subscription status.", error);
  }
}

export async function getPersistedSubscriptionStatus(userId?: string) {
  if (!userId) return false;

  const { data, error } = await supabase.from("user_subscription_status").select("is_pro").eq("user_id", userId).maybeSingle();

  if (error) {
    console.warn("Failed to load persisted subscription status.", error);
    return false;
  }

  return Boolean(data?.is_pro);
}

export async function getSubscriptionStatus(userId?: string): Promise<SubscriptionStatus> {
  const isConfigured = await configureSubscriptions(userId);

  if (!isConfigured) {
    return {
      isConfigured: false,
      isPro: false,
      entitlementId,
      customerInfo: null,
    };
  }

  const customerInfo = await Purchases.getCustomerInfo();
  await persistSubscriptionStatus(customerInfo, userId);

  return {
    isConfigured: true,
    isPro: hasActiveSubscription(customerInfo),
    entitlementId,
    customerInfo,
  };
}

export async function getSubscriptionPackages(userId?: string): Promise<PurchasesPackage[]> {
  const isConfigured = await configureSubscriptions(userId);
  if (!isConfigured) return [];

  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchaseSubscription(subscriptionPackage: PurchasesPackage, userId?: string) {
  const { customerInfo } = await Purchases.purchasePackage(subscriptionPackage);
  await persistSubscriptionStatus(customerInfo, userId);
  return customerInfo;
}

export async function restoreSubscriptionPurchases(userId?: string) {
  const isConfigured = await configureSubscriptions(userId);
  if (!isConfigured) {
    throw new Error("RevenueCat API 키가 설정되지 않았어요.");
  }

  const customerInfo = await Purchases.restorePurchases();
  await persistSubscriptionStatus(customerInfo, userId);
  return customerInfo;
}
