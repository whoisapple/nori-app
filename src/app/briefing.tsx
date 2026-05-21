import { msClose } from "@material-symbols-react-native/outlined-300/msClose";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MsIcon } from "material-symbols-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BriefingPlayer } from "@/components/briefing/BriefingPlayer";
import { useBriefingAccess } from "@/hooks/use-briefing-access";
import { useTodayBriefing } from "@/hooks/use-today-briefing";
import { showRewardedAdForBriefingUnlock } from "@/lib/ads";

function formatBriefingDate(value?: string) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}. ${month}. ${day}. 요약`;
}

export default function BriefingScreen() {
  const router = useRouter();
  const { briefing, loading, error } = useTodayBriefing();
  const briefingAccess = useBriefingAccess(briefing);
  const insets = useSafeAreaInsets();
  const summaryCount = briefing?.segments.length ?? 0;

  return (
    <View style={styles.screen}>
      <View style={styles.frame}>
        <View style={styles.contentWrapper}>
          <LinearGradient colors={["#ff9393", "#ff8686", "#8886ee", "#5b87ff"]} locations={[0, 0.28, 0.68, 1]} style={styles.mainContent}>
            <SafeAreaView edges={["top"]} style={styles.safeArea}>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.eyebrow}>{formatBriefingDate(briefing?.date)}</Text>
                  <Text style={styles.subtitle}>{summaryCount > 0 ? `총 ${summaryCount}개의 이슈를 요약했어요` : "오늘의 이슈를 요약했어요"}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="브리핑 닫기" onPress={() => router.back()} style={styles.closeButton}>
                  <MsIcon icon={msClose} size={24} color="#717181" />
                </Pressable>
              </View>

              {loading ? (
                <View style={styles.stateMessage}>
                  <Text style={styles.stateTitle}>브리핑을 불러오는 중</Text>
                </View>
              ) : error ? (
                <View style={styles.stateMessage}>
                  <Text style={styles.stateTitle}>브리핑을 불러오지 못했어요</Text>
                  <Text style={styles.stateDescription}>{error}</Text>
                </View>
              ) : briefing ? (
                <BriefingPlayer
                  briefing={briefing}
                  freeSeconds={briefingAccess.freeSeconds}
                  isUnlocked={briefingAccess.isUnlocked}
                  isPro={briefingAccess.isPro}
                  onRewardedUnlock={async () => {
                    const earnedReward = await showRewardedAdForBriefingUnlock();
                    if (earnedReward) {
                      await briefingAccess.markRewardedUnlock();
                    }
                    return earnedReward;
                  }}
                />
              ) : (
                <View style={styles.stateMessage}>
                  <Text style={styles.stateTitle}>오늘 공개된 브리핑이 없어요</Text>
                  <Text style={styles.stateDescription}>브리핑이 발행되면 여기에서 바로 들을 수 있어요.</Text>
                </View>
              )}
            </SafeAreaView>
          </LinearGradient>
          <View style={[styles.homeIndicatorArea, { height: Math.max(insets.bottom, 24) + 10 }]}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  frame: {
    flex: 1,
    backgroundColor: "#000000",
    borderRadius: 56,
    overflow: "hidden",
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mainContent: {
    flex: 1,
    borderTopLeftRadius: 56,
    borderTopRightRadius: 56,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#ffffff",
  },
  headerText: {
    flex: 1,
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
    color: "#ffffff",
  },
  stateMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  stateDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  homeIndicatorArea: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
    backgroundColor: "#000000",
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#babacc",
  },
});
