import React from "react";
import { Animated, StyleSheet, View } from "react-native";

type SkeletonBoxProps = {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: object;
};

export function SkeletonBox({ width = "100%", height, radius = 8, style }: SkeletonBoxProps) {
  const opacity = React.useRef(new Animated.Value(0.48)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 780, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.48, duration: 780, useNativeDriver: true }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.box, { width, height, borderRadius: radius, opacity }, style]} />;
}

export function HomeSkeleton() {
  return (
    <View style={styles.homeDeck}>
      <View style={styles.backCard} />
      <View style={styles.middleCard} />
      <View style={styles.homeCard}>
        <SkeletonBox height={176} radius={8} />
        <View style={styles.homeMeta}>
          <View style={styles.dotRow}>
            <SkeletonBox width={32} height={32} radius={16} />
            <SkeletonBox width={32} height={32} radius={16} style={styles.dotOverlap} />
            <SkeletonBox width={32} height={32} radius={16} style={styles.dotOverlap} />
          </View>
          <SkeletonBox width={72} height={32} radius={16} />
        </View>
        <SkeletonBox height={34} radius={6} />
        <SkeletonBox width="86%" height={34} radius={6} />
        <View style={styles.summaryLines}>
          <SkeletonBox height={22} radius={6} />
          <SkeletonBox width="74%" height={22} radius={6} />
        </View>
      </View>
    </View>
  );
}

export function CategorySkeleton() {
  return (
    <View>
      <View style={styles.categoryLargeCard}>
        <SkeletonBox height={184} radius={8} />
        <SkeletonBox height={24} radius={6} style={styles.categoryTitleLine} />
        <SkeletonBox width="76%" height={24} radius={6} />
        <View style={styles.categoryMeta}>
          <SkeletonBox width={16} height={16} radius={8} />
          <SkeletonBox width={88} height={14} radius={6} />
          <SkeletonBox width={52} height={14} radius={6} />
        </View>
      </View>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.categoryRow}>
          <View style={styles.categoryRowBody}>
            <SkeletonBox height={22} radius={6} />
            <SkeletonBox width="82%" height={22} radius={6} />
            <View style={styles.categoryMeta}>
              <SkeletonBox width={16} height={16} radius={8} />
              <SkeletonBox width={76} height={14} radius={6} />
              <SkeletonBox width={48} height={14} radius={6} />
            </View>
          </View>
          <SkeletonBox width={88} height={88} radius={8} />
        </View>
      ))}
    </View>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <View>
      <View style={styles.detailHero}>
        <SkeletonBox height={190} radius={16} />
        <SkeletonBox width={96} height={14} radius={6} style={styles.detailSource} />
      </View>
      <View style={styles.detailContent}>
        <View style={styles.detailMeta}>
          <View style={styles.dotRow}>
            <SkeletonBox width={32} height={32} radius={16} />
            <SkeletonBox width={32} height={32} radius={16} style={styles.dotOverlap} />
            <SkeletonBox width={32} height={32} radius={16} style={styles.dotOverlap} />
          </View>
          <SkeletonBox width={96} height={18} radius={6} />
        </View>
        <SkeletonBox height={34} radius={6} />
        <SkeletonBox width="92%" height={34} radius={6} />
        <View style={styles.detailSummary}>
          <SkeletonBox width={2} height={84} radius={1} />
          <View style={styles.detailSummaryLines}>
            <SkeletonBox height={24} radius={6} />
            <SkeletonBox height={24} radius={6} />
            <SkeletonBox width="66%" height={24} radius={6} />
          </View>
        </View>
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBox key={index} width={index === 4 ? "72%" : "100%"} height={20} radius={6} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#e4e4f2",
  },
  homeDeck: {
    width: "100%",
    alignItems: "center",
    paddingTop: 22,
  },
  backCard: {
    width: "82%",
    height: 28,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.44)",
  },
  middleCard: {
    width: "90%",
    height: 34,
    marginTop: -16,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  homeCard: {
    width: "100%",
    gap: 14,
    marginTop: -12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },
  homeMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dotRow: {
    flexDirection: "row",
  },
  dotOverlap: {
    marginLeft: -10,
  },
  summaryLines: {
    gap: 9,
    marginTop: 4,
  },
  categoryLargeCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeefa",
  },
  categoryTitleLine: {
    marginTop: 12,
    marginBottom: 8,
  },
  categoryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeefa",
  },
  categoryRowBody: {
    flex: 1,
    gap: 8,
  },
  detailHero: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  detailSource: {
    alignSelf: "center",
  },
  detailContent: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailSummary: {
    flexDirection: "row",
    gap: 8,
  },
  detailSummaryLines: {
    flex: 1,
    gap: 6,
  },
});
