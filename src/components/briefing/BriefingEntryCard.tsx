import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DailyBriefing } from "@/lib/briefings";

type BriefingEntryCardProps = {
  briefing: DailyBriefing | null;
  loading?: boolean;
  onPress: () => void;
};

export function BriefingEntryCard({ briefing, loading, onPress }: BriefingEntryCardProps) {
  if (!loading && !briefing) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="오늘의 5분 브리핑 듣기"
      disabled={!briefing}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && briefing ? styles.pressed : null, !briefing ? styles.disabled : null]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>오디오 브리핑</Text>
        <Text style={styles.title}>{briefing?.title ?? "오늘의 브리핑 확인 중"}</Text>
      </View>
      <Text style={styles.duration}>{briefing?.duration_seconds ? `${Math.ceil(briefing.duration_seconds / 60)}분` : loading ? "로딩" : "없음"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.55,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#3f6ef1",
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#303041",
  },
  duration: {
    fontSize: 13,
    fontWeight: "700",
    color: "#717181",
  },
});
