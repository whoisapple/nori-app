import { supabase } from "@/lib/supabase";

export const DEFAULT_FREE_BRIEFING_SECONDS = Number(process.env.EXPO_PUBLIC_BRIEFING_FREE_SECONDS ?? 60);

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user?.id ?? null;
}

export async function isBriefingUnlocked(briefingId: string) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("briefing_unlocks")
    .select("briefing_id,expires_at")
    .eq("user_id", userId)
    .eq("briefing_id", briefingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return false;
  }

  return !data.expires_at || new Date(data.expires_at).getTime() > Date.now();
}

export async function unlockBriefingWithRewardedAd(briefingId: string) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("로그인 후 광고를 보고 이어들을 수 있어요.");
  }

  const { error } = await supabase.from("briefing_unlocks").upsert(
    {
      user_id: userId,
      briefing_id: briefingId,
      source: "rewarded_ad",
      unlocked_at: new Date().toISOString(),
      expires_at: null,
    },
    { onConflict: "user_id,briefing_id" },
  );

  if (error) {
    throw error;
  }
}
