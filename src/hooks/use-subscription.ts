import React from "react";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";

import {
  getSubscriptionPackages,
  getPersistedSubscriptionStatus,
  getSubscriptionStatus,
  hasActiveSubscription,
  purchaseSubscription,
  restoreSubscriptionPurchases,
} from "@/lib/subscriptions";

type UseSubscriptionOptions = {
  userId?: string;
};

export function useSubscription({ userId }: UseSubscriptionOptions = {}) {
  const [packages, setPackages] = React.useState<PurchasesPackage[]>([]);
  const [customerInfo, setCustomerInfo] = React.useState<CustomerInfo | null>(null);
  const [isConfigured, setIsConfigured] = React.useState(false);
  const [persistedIsPro, setPersistedIsPro] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [status, nextPackages] = await Promise.all([getSubscriptionStatus(userId), getSubscriptionPackages(userId)]);
      const persistedIsPro = await getPersistedSubscriptionStatus(userId);
      setIsConfigured(status.isConfigured);
      setPersistedIsPro(persistedIsPro);
      setCustomerInfo(status.customerInfo);
      setPackages(nextPackages);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "구독 정보를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const purchase = React.useCallback(
    async (subscriptionPackage: PurchasesPackage) => {
      setBusy(true);
      setError(null);

      try {
        const nextCustomerInfo = await purchaseSubscription(subscriptionPackage, userId);
        setCustomerInfo(nextCustomerInfo);
        setPersistedIsPro(hasActiveSubscription(nextCustomerInfo));
        return nextCustomerInfo;
      } catch (nextError) {
        const code = typeof nextError === "object" && nextError !== null && "code" in nextError ? String(nextError.code) : "";
        if (code === "1" || code === "PURCHASE_CANCELLED") return null;

        setError(nextError instanceof Error ? nextError.message : "결제를 완료하지 못했어요.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [userId],
  );

  const restore = React.useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const nextCustomerInfo = await restoreSubscriptionPurchases(userId);
      setCustomerInfo(nextCustomerInfo);
      setPersistedIsPro(hasActiveSubscription(nextCustomerInfo));
      return nextCustomerInfo;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "구매 복원에 실패했어요.");
      return null;
    } finally {
      setBusy(false);
    }
  }, [userId]);

  return {
    packages,
    customerInfo,
    isConfigured,
    isPro: hasActiveSubscription(customerInfo) || persistedIsPro,
    loading,
    busy,
    error,
    purchase,
    restore,
    refresh,
  };
}
