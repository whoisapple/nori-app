import React from "react";

import { useAuthSession } from "@/hooks/use-auth-session";
import { useSubscription } from "@/hooks/use-subscription";
import { DEFAULT_FREE_BRIEFING_SECONDS, isBriefingUnlocked, unlockBriefingWithRewardedAd } from "@/lib/briefing-unlocks";
import type { DailyBriefing } from "@/lib/briefings";

export function useBriefingAccess(briefing: DailyBriefing | null) {
  const { session } = useAuthSession();
  const { isPro, loading: subscriptionLoading } = useSubscription({ userId: session?.user.id });
  const [adUnlocked, setAdUnlocked] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!briefing?.id) {
      setAdUnlocked(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unlocked = await isBriefingUnlocked(briefing.id);
      setAdUnlocked(unlocked);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "브리핑 잠금 상태를 확인하지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [briefing?.id]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const markRewardedUnlock = React.useCallback(async () => {
    if (!briefing?.id) return;

    await unlockBriefingWithRewardedAd(briefing.id);
    setAdUnlocked(true);
  }, [briefing?.id]);

  return {
    freeSeconds: DEFAULT_FREE_BRIEFING_SECONDS,
    isUnlocked: isPro || adUnlocked,
    isPro,
    loading: loading || subscriptionLoading,
    error,
    markRewardedUnlock,
    refresh,
  };
}
