import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { BriefingSegment } from "@/lib/briefings";

type BriefingTranscriptProps = {
  segments: BriefingSegment[];
  activeSegmentId?: string;
  onSegmentPress: (segment: BriefingSegment) => void;
};

export function getActiveSegment(segments: BriefingSegment[], currentTime: number) {
  return segments.find((segment) => segment.start_time <= currentTime && currentTime < segment.end_time) ?? null;
}

export function BriefingTranscript({ segments, activeSegmentId, onSegmentPress }: BriefingTranscriptProps) {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const itemOffsets = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    if (!activeSegmentId) return;

    const y = itemOffsets.current[activeSegmentId];
    if (typeof y !== "number") return;

    scrollViewRef.current?.scrollTo({ y: Math.max(y - 96, 0), animated: true });
  }, [activeSegmentId]);

  if (segments.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>브리핑 문장이 아직 없어요.</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {segments.map((segment, index) => {
        const active = segment.id === activeSegmentId;
        const alignEnd = segment.speaker === "host_b" || (!segment.speaker && index % 2 === 1);

        return (
          <Pressable
            key={segment.id}
            accessibilityRole="button"
            accessibilityLabel={`${segment.order_index + 1}번째 문장으로 이동`}
            onLayout={(event) => {
              itemOffsets.current[segment.id] = event.nativeEvent.layout.y;
            }}
            onPress={() => onSegmentPress(segment)}
            style={[styles.segment, alignEnd ? styles.segmentEnd : null]}
          >
            <Text style={[styles.segmentText, alignEnd ? styles.segmentTextEnd : null, active ? styles.activeText : styles.inactiveText]}>{segment.text}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 220,
    gap: 16,
  },
  segment: {
    width: "100%",
    alignItems: "flex-start",
    gap: 4,
  },
  segmentEnd: {
    alignItems: "flex-end",
  },
  segmentText: {
    maxWidth: 256,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: "#ffffff",
  },
  segmentTextEnd: {
    textAlign: "right",
  },
  activeText: {
    opacity: 1,
  },
  inactiveText: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
  },
});
