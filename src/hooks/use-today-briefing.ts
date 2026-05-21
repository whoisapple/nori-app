import React from "react";

import { generateTodayBriefingAudio, getTodayBriefing, type DailyBriefing } from "@/lib/briefings";

export function useTodayBriefing() {
  const [briefing, setBriefing] = React.useState<DailyBriefing | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadBriefing = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextBriefing = await getTodayBriefing();
      setBriefing(nextBriefing);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "브리핑을 불러오지 못했어요.");
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadBriefing();
  }, [loadBriefing]);

  const generateAudio = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await generateTodayBriefingAudio();
      await loadBriefing();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "TTS 오디오를 만들지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [loadBriefing]);

  return {
    briefing,
    loading,
    error,
    generateAudio,
    refresh: loadBriefing,
  };
}
