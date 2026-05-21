import { msPause } from "@material-symbols-react-native/outlined-300/msPause";
import { msPlayArrow } from "@material-symbols-react-native/outlined-300/msPlayArrow";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MsIcon } from "material-symbols-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ProgressiveBlurView } from "react-native-progressive-blur-view";

import { BriefingTranscript, getActiveSegment } from "@/components/briefing/BriefingTranscript";
import type { BriefingSegment, DailyBriefing } from "@/lib/briefings";

type BriefingPlayerProps = {
  briefing: DailyBriefing;
  freeSeconds: number;
  isUnlocked: boolean;
  isPro: boolean;
  onRewardedUnlock: () => Promise<boolean>;
};

function formatTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function BriefingPlayer({ briefing, freeSeconds, isUnlocked, isPro, onRewardedUnlock }: BriefingPlayerProps) {
  const router = useRouter();
  const [progressWidth, setProgressWidth] = React.useState(0);
  const [unlocking, setUnlocking] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);
  const source = React.useMemo(() => (briefing.audio_url ? { uri: briefing.audio_url } : null), [briefing.audio_url]);
  const player = useAudioPlayer(source, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || briefing.duration_seconds || 0;
  const currentTime = Math.min(status.currentTime || 0, duration || status.currentTime || 0);
  const freeLimit = Math.min(Math.max(freeSeconds, 0), duration || freeSeconds);
  const effectiveDuration = isUnlocked || !duration ? duration : freeLimit;
  const activeSegment = React.useMemo(() => getActiveSegment(briefing.segments, currentTime), [briefing.segments, currentTime]);
  const progress = effectiveDuration > 0 ? Math.min(currentTime / effectiveDuration, 1) : 0;
  const reachedFreeLimit = Boolean(duration) && currentTime >= Math.max(freeLimit - 0.2, 0);
  const showUnlockOverlay = !isUnlocked && reachedFreeLimit;

  React.useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: true,
    });
  }, []);

  React.useEffect(() => {
    if (!briefing.audio_url) return;

    try {
      player.setActiveForLockScreen(true, {
        title: briefing.title,
        artist: "NORI",
      });
    } catch (error) {
      console.warn("Failed to activate lock screen audio controls.", error);
    }

    return () => {
      try {
        player.setActiveForLockScreen(false);
      } catch {
        // Ignore cleanup errors from released native player handles.
      }
    };
  }, [briefing.audio_url, briefing.title, player]);

  React.useEffect(() => {
    if (isUnlocked || !duration || !status.playing || currentTime < freeLimit) {
      return;
    }

    player.pause();
    void player.seekTo(freeLimit);
  }, [currentTime, duration, freeLimit, isUnlocked, player, status.playing]);

  const handlePlayPause = () => {
    if (!briefing.audio_url) return;

    if (status.playing) {
      player.pause();
      return;
    }

    if (!isUnlocked && duration && currentTime >= freeLimit - 0.2) {
      void player.seekTo(Math.max(0, freeLimit - 0.2));
    }

    player.play();
  };

  const seekTo = React.useCallback(
    async (seconds: number) => {
      if (!briefing.audio_url) return;

      const nextSeconds = isUnlocked ? seconds : Math.min(seconds, freeLimit);
      await player.seekTo(Math.max(0, nextSeconds));
    },
    [briefing.audio_url, freeLimit, isUnlocked, player],
  );

  const handleProgressPress = async (locationX: number, width: number) => {
    if (!effectiveDuration || width <= 0) return;

    await seekTo((locationX / width) * effectiveDuration);
  };

  const handleSegmentPress = (segment: BriefingSegment) => {
    void seekTo(segment.start_time);
  };

  const handleRewardedUnlock = async () => {
    setUnlocking(true);
    setUnlockError(null);

    try {
      const unlocked = await onRewardedUnlock();
      if (!unlocked) {
        setUnlockError("광고를 끝까지 보면 이어들을 수 있어요.");
      }
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : "광고를 불러오지 못했어요.");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stageMask}>
        <LinearGradient colors={["#ff9393", "#ff8686", "#8886ee", "#5b87ff"]} locations={[0, 0.28, 0.68, 1]} style={styles.stageGradient}>
          <BriefingTranscript segments={briefing.segments} activeSegmentId={activeSegment?.id} onSegmentPress={handleSegmentPress} />

          {!briefing.audio_url ? <Text style={styles.errorText}>오디오 URL이 없어서 텍스트만 표시해요.</Text> : null}

          {showUnlockOverlay ? (
            <View pointerEvents="box-none" style={styles.unlockOverlay}>
              <ProgressiveBlurView
                blurAmount={18}
                blurType="dark"
                locations={[0, 0.28, 0.58, 1]}
                opacities={[0, 0.2, 0.58, 0.95]}
                style={styles.progressiveBlur}
              />
              <LinearGradient
                colors={["rgba(255,147,147,0)", "rgba(255,134,134,0.22)", "rgba(136,134,238,0.6)", "#5b87ff"]}
                locations={[0, 0.28, 0.66, 1]}
                style={styles.unlockGradient}
              />
              <View style={styles.unlockContent}>
                <View style={styles.unlockCopy}>
                  <Text style={styles.unlockTitle}>오늘의 흐름, 끝까지 들어보세요</Text>
                  <Text style={styles.unlockDescription}>광고를 보고 이어 듣거나, NORI PRO로 광고 없이{"\n"}전체 브리핑을 들을 수 있어요.</Text>
                  {unlockError ? <Text style={styles.unlockError}>{unlockError}</Text> : null}
                </View>
                <View style={styles.unlockActions}>
                  <Pressable accessibilityRole="button" disabled={unlocking} onPress={() => void handleRewardedUnlock()} style={({ pressed }) => [styles.adButton, pressed ? styles.pressedButton : null, unlocking ? styles.disabledButton : null]}>
                    <Text style={styles.adButtonText}>{unlocking ? "광고 준비 중" : "광고 보고 이어 듣기"}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => router.push("/paywall")} style={({ pressed }) => [styles.proButton, pressed ? styles.pressedButton : null]}>
                    <Text style={styles.proButtonText}>{isPro ? "PRO 적용됨" : "PRO 가입하기"}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? "브리핑 일시정지" : "브리핑 재생"}
          disabled={!briefing.audio_url}
          onPress={handlePlayPause}
          style={[styles.playButton, !briefing.audio_url ? styles.disabledButton : null]}
        >
          <MsIcon icon={status.playing ? msPause : msPlayArrow} size={22} color="#f9f9ff" />
        </Pressable>

        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel="브리핑 진행바"
          disabled={!briefing.audio_url || !effectiveDuration}
          onPress={(event) => {
            void handleProgressPress(event.nativeEvent.locationX, progressWidth);
          }}
          onLayout={(event) => {
            setProgressWidth(event.nativeEvent.layout.width);
          }}
          style={styles.progressTrack}
        >
          <LinearGradient
            colors={["#5b87ff", "#8886ee", "#ff8686", "#ff9393"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </Pressable>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>/</Text>
          <Text style={styles.timeText}>{formatTime(isUnlocked ? duration : effectiveDuration)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stageMask: {
    flex: 1,
    backgroundColor: "#000000",
  },
  stageGradient: {
    flex: 1,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  controls: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: "#000000",
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  disabledButton: {
    opacity: 0.45,
  },
  timeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#f9f9ff",
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 78,
    overflow: "hidden",
    backgroundColor: "#eeeefa",
  },
  progressFill: {
    height: "100%",
    borderRadius: 30,
  },
  timeRow: {
    width: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  errorText: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 74,
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.75,
  },
  unlockOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "flex-end",
  },
  progressiveBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  unlockGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  unlockContent: {
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  unlockCopy: {
    alignItems: "center",
    gap: 4,
  },
  unlockTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  unlockDescription: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "500",
    color: "#ffffff",
    textAlign: "center",
  },
  unlockError: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#ffffff",
    opacity: 0.85,
    textAlign: "center",
  },
  unlockActions: {
    flexDirection: "row",
    gap: 4,
  },
  adButton: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  adButtonText: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: "#ffffff",
  },
  proButton: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    backgroundColor: "#ffffff",
  },
  proButtonText: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: "#000000",
  },
  pressedButton: {
    opacity: 0.75,
  },
});
