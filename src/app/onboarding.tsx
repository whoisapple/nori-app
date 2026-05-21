import React from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MsIcon } from "material-symbols-react-native";
import { msArrowForward } from "@material-symbols-react-native/outlined-300/msArrowForward";
import { msCheck } from "@material-symbols-react-native/outlined-300/msCheck";
import { msNewspaper } from "@material-symbols-react-native/outlined-300/msNewspaper";
import { msSearch } from "@material-symbols-react-native/outlined-300/msSearch";
import { msSwipe } from "@material-symbols-react-native/outlined-300/msSwipe";

import { setOnboardingComplete } from "@/lib/onboarding";

const steps = [
  {
    icon: msNewspaper,
    title: "이슈를 한 장씩",
    description: "오늘 중요한 뉴스를 카드로 빠르게 확인해요.",
  },
  {
    icon: msSwipe,
    title: "스와이프로 넘기기",
    description: "관심 없는 이슈는 넘기고, 궁금한 이슈는 눌러 자세히 봐요.",
  },
  {
    icon: msSearch,
    title: "필요할 때 바로 검색",
    description: "카테고리와 키워드로 놓친 이슈를 다시 찾을 수 있어요.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const currentStep = steps[index];
  const isLast = index === steps.length - 1;

  const finish = async () => {
    await setOnboardingComplete();
    router.replace("/");
  };

  const next = () => {
    if (isLast) {
      void finish();
      return;
    }

    setIndex((value) => value + 1);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.frame}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={finish} style={styles.skipButton}>
              <Text style={styles.skipText}>건너뛰기</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.visual}>
              <View style={styles.backCard} />
              <View style={styles.middleCard} />
              <View style={styles.frontCard}>
                <View style={styles.iconBadge}>
                  <MsIcon icon={currentStep.icon} size={42} color="#3f6ef1" />
                </View>
                <View style={styles.previewLines}>
                  <View style={[styles.previewLine, { width: "82%" }]} />
                  <View style={[styles.previewLine, { width: "64%" }]} />
                  <View style={[styles.previewLineMuted, { width: "74%" }]} />
                </View>
              </View>
            </View>

            <View style={styles.copy}>
              <Text style={styles.eyebrow}>NORI</Text>
              <Text style={styles.title}>{currentStep.title}</Text>
              <Text style={styles.description}>{currentStep.description}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {steps.map((step, stepIndex) => (
                <View key={step.title} style={[styles.dot, stepIndex === index && styles.dotActive]} />
              ))}
            </View>
            <Pressable accessibilityRole="button" onPress={next} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{isLast ? "시작하기" : "다음"}</Text>
              <MsIcon icon={isLast ? msCheck : msArrowForward} size={22} color="#f9f9ff" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f2f2fc",
  },
  frame: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 56,
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },
  header: {
    height: 52,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  skipButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#69697c",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 36,
    paddingHorizontal: 24,
  },
  visual: {
    height: 310,
    alignItems: "center",
    justifyContent: "center",
  },
  backCard: {
    position: "absolute",
    width: "78%",
    height: 230,
    borderRadius: 24,
    backgroundColor: "#d8e0ff",
    transform: [{ translateY: -26 }, { scale: 0.88 }],
  },
  middleCard: {
    position: "absolute",
    width: "86%",
    height: 240,
    borderRadius: 24,
    backgroundColor: "#e8edff",
    transform: [{ translateY: -8 }, { scale: 0.94 }],
  },
  frontCard: {
    width: "94%",
    minHeight: 250,
    justifyContent: "space-between",
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },
  iconBadge: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 42,
    backgroundColor: "rgba(63, 110, 241, 0.12)",
  },
  previewLines: {
    gap: 10,
  },
  previewLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#303041",
  },
  previewLineMuted: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#babacc",
  },
  copy: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3f6ef1",
  },
  title: {
    fontSize: 34,
    lineHeight: 43,
    fontWeight: "700",
    color: "#191927",
  },
  description: {
    fontSize: 17,
    lineHeight: 27,
    fontWeight: "500",
    color: "#47475c",
  },
  footer: {
    gap: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d8d8e8",
  },
  dotActive: {
    width: 28,
    backgroundColor: "#3f6ef1",
  },
  primaryButton: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 28,
    backgroundColor: "#191927",
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#f9f9ff",
  },
});
