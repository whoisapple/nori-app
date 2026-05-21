import { GoogleNativeAdCard } from "@/components/GoogleNativeAdCard";
import { SourceStack } from "@/components/SourceStack";
import { msBookmark } from "@material-symbols-react-native/outlined-300/msBookmark";
import { msBookmarkFill } from "@material-symbols-react-native/outlined-300/msBookmarkFill";
import { msFlag } from "@material-symbols-react-native/outlined-300/msFlag";
import { msThumbDownFill } from "@material-symbols-react-native/outlined-300/msThumbDownFill";
import { msThumbUpFill } from "@material-symbols-react-native/outlined-300/msThumbUpFill";
import { Image as ExpoImage } from "expo-image";
import { MsIcon } from "material-symbols-react-native";
import React, { useImperativeHandle, useRef, useState } from "react";
import type { GestureResponderEvent } from "react-native";
import { Animated, PanResponder, Pressable, Text, View } from "react-native";
import type { IssueItem } from "../types";
import { getCardDimensions, getNewsIndex, scaleTopOffset } from "../utils/scale";

export type SwipeReaction = "like" | "dislike";

export interface SwipeableNewsDeckHandle {
  react: (reaction: SwipeReaction) => void;
}

interface SwipeableNewsDeckProps {
  items: IssueItem[];
  onActiveIssueChange?: (issue: IssueItem | undefined) => void;
  onIssuePress?: (issue: IssueItem) => void;
  onReport?: (issue: IssueItem) => void;
  bookmarkedIds?: Set<string>;
  onBookmarkToggle?: (issue: IssueItem) => void;
  hideAds?: boolean;
}

type DeckItem = { type: "issue"; issue: IssueItem } | { type: "ad"; id: string };

function buildDeckItems(items: IssueItem[], hideAds = false) {
  const deckItems: DeckItem[] = [];

  items.forEach((issue, index) => {
    deckItems.push({ type: "issue", issue });

    if (!hideAds && (index + 1) % 4 === 0) {
      deckItems.push({ type: "ad", id: `native-ad-${index}` });
    }
  });

  return deckItems;
}

function Card({
  item,
  hideImage,
  onReport,
  bookmarkedIds,
  onBookmarkToggle,
}: {
  item: DeckItem;
  hideImage?: boolean;
  onReport?: (issue: IssueItem) => void;
  bookmarkedIds?: Set<string>;
  onBookmarkToggle?: (issue: IssueItem) => void;
}) {
  if (item.type === "ad") {
    return <GoogleNativeAdCard variant="deck" placeholderOnly={hideImage} />;
  }

  const issue = item.issue;
  const sourceImages = issue.sourceLogos;
  const sourceLabels = issue.sources.length > 0 ? issue.sources : Array.from({ length: issue.reportCount }, () => "매체");
  const bookmarked = bookmarkedIds?.has(issue.id) ?? false;
  const handleReport = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onReport?.(issue);
  };
  const handleBookmark = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onBookmarkToggle?.(issue);
  };

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" }}>
        {hideImage ? (
          <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#f2f2fc", borderRadius: 8 }} />
        ) : (
          <View style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 8, overflow: "hidden" }}>
            <ExpoImage source={issue.image} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          </View>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <SourceStack images={sourceImages} labels={sourceLabels} count={issue.reportCount} size={32} overlap={12} maxDisplay={4} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={bookmarked ? "북마크 해제" : "북마크"}
              hitSlop={8}
              onPress={handleBookmark}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: bookmarked ? "#303041" : "#f9f9ff", alignItems: "center", justifyContent: "center" }}
            >
              <MsIcon icon={bookmarked ? msBookmarkFill : msBookmark} size={20} color={bookmarked ? "#ffffff" : "#717181"} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="신고"
              hitSlop={8}
              onPress={handleReport}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#f9f9ff", alignItems: "center", justifyContent: "center" }}
            >
              <MsIcon icon={msFlag} size={20} color="#717181" />
            </Pressable>
          </View>
        </View>

        <Text
          style={{ fontSize: 25, fontWeight: "600", lineHeight: 35, color: "#303041" }}
          numberOfLines={2}
        >
          {issue.title}
        </Text>

        <Text
          style={{ fontSize: 17, fontWeight: "500", lineHeight: 29, color: "#47475c", marginTop: 4 }}
          numberOfLines={3}
        >
          {issue.shortSummary}
        </Text>
      </View>
    </View>
  );
}

function FeedbackOverlay({
  direction,
  opacity,
}: {
  direction: 1 | -1;
  opacity: Animated.AnimatedInterpolation<number>;
}) {
  const isLike = direction > 0;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: isLike ? "#3f6ef1" : "#f34026",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity,
      }}
    >
      <MsIcon icon={isLike ? msThumbUpFill : msThumbDownFill} size={96} color="#f9f9ff" />
      <Text style={{ fontSize: 32, lineHeight: 51, fontWeight: "600", color: "#f9f9ff" }}>
        {isLike ? "좋아요" : "싫어요"}
      </Text>
    </Animated.View>
  );
}

function SwipeableNewsDeckComponent(
  { items, onActiveIssueChange, onIssuePress, onReport, bookmarkedIds, onBookmarkToggle, hideAds }: SwipeableNewsDeckProps,
  ref: React.ForwardedRef<SwipeableNewsDeckHandle>,
) {
  const deckItems = React.useMemo(() => buildDeckItems(items, hideAds), [hideAds, items]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewDirection, setPreviewDirection] = useState<1 | -1>(-1);
  const activeIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const position = useRef(new Animated.ValueXY()).current;
  const stackProgress = useRef(new Animated.Value(0)).current;
  const previewDirectionRef = useRef<1 | -1>(-1);

  const { cardWidth, cardHeight, middleCardScaleValue, backCardScaleValue, swipeExitDistance } = getCardDimensions();

  const completeSwipe = React.useCallback(
    (direction: 1 | -1, verticalOffset = 0, velocity = 0) => {
      if (isAnimatingRef.current || deckItems.length === 0) {
        return;
      }

      isAnimatingRef.current = true;

      if (previewDirectionRef.current !== direction) {
        previewDirectionRef.current = direction;
        setPreviewDirection(direction);
      }

      Animated.parallel([
        Animated.timing(position, {
          toValue: { x: direction * swipeExitDistance, y: verticalOffset },
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(stackProgress, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) {
          isAnimatingRef.current = false;
          return;
        }

        const len = deckItems.length;
        const currentIdx = activeIndexRef.current;
        const nextIndex = getNewsIndex(currentIdx + (direction < 0 ? 1 : len - 1), len);
        const actualItem = deckItems[getNewsIndex(nextIndex, len)];
        activeIndexRef.current = nextIndex;

        position.setValue({ x: 0, y: 0 });
        stackProgress.setValue(0);
        setActiveIndex(nextIndex);
        onActiveIssueChange?.(actualItem?.type === "issue" ? actualItem.issue : undefined);
        isAnimatingRef.current = false;
      });
    },
    [deckItems, onActiveIssueChange, position, stackProgress, swipeExitDistance],
  );

  useImperativeHandle(
    ref,
    () => ({
      react: (reaction) => {
        completeSwipe(reaction === "like" ? 1 : -1, 0, reaction === "like" ? 0.9 : -0.9);
      },
    }),
    [completeSwipe],
  );

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) =>
      !isAnimatingRef.current && Math.abs(gesture.dx) > 4 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.15,
    onPanResponderGrant: () => {
      position.stopAnimation();
      stackProgress.stopAnimation();
      stackProgress.setValue(0);
      position.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (_, gesture) => {
      const direction = gesture.dx < 0 ? -1 : 1;
      if (previewDirectionRef.current !== direction) {
        previewDirectionRef.current = direction;
        setPreviewDirection(direction);
      }

      const dragProgress = Math.min(Math.abs(gesture.dx) / (cardWidth * 0.7), 1) * 0.65;
      stackProgress.setValue(dragProgress);
      position.setValue({ x: gesture.dx, y: gesture.dy * 0.12 });
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: () => {
      Animated.parallel([
        Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.spring(stackProgress, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
      ]).start();
    },
    onPanResponderRelease: (_, gesture) => {
      const shouldAdvance = Math.abs(gesture.dx) > cardWidth * 0.22 || Math.abs(gesture.vx) > 0.55;

      if (!shouldAdvance) {
        Animated.parallel([
          Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, tension: 95, useNativeDriver: true }),
          Animated.spring(stackProgress, { toValue: 0, friction: 6, tension: 95, useNativeDriver: true }),
        ]).start();
        return;
      }

      const direction = gesture.dx > 0 ? 1 : -1;
      completeSwipe(direction, gesture.dy * 0.12, gesture.vx);
    },
  });

  const directionOffset = previewDirection < 0 ? 1 : -1;

  const activeScale = position.x.interpolate({
    inputRange: [-cardWidth, -cardWidth * 0.35, 0, cardWidth * 0.35, cardWidth],
    outputRange: [0.975, 0.992, 1, 0.992, 0.975],
    extrapolate: "clamp",
  });

  const activeTilt = position.x.interpolate({
    inputRange: [-cardWidth, 0, cardWidth],
    outputRange: ["-15deg", "0deg", "15deg"],
    extrapolate: "clamp",
  });

  const middleCardTranslateY = stackProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-scaleTopOffset(middleCardScaleValue, cardHeight), 12],
    extrapolate: "clamp",
  });

  const middleCardScale = stackProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [middleCardScaleValue, 1],
    extrapolate: "clamp",
  });

  const backCardTranslateY = stackProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-scaleTopOffset(backCardScaleValue, cardHeight), 10 - scaleTopOffset(middleCardScaleValue, cardHeight)],
    extrapolate: "clamp",
  });

  const backCardScale = stackProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [backCardScaleValue, middleCardScaleValue],
    extrapolate: "clamp",
  });

  const incomingBackTranslateY = stackProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-scaleTopOffset(backCardScaleValue, cardHeight) - 10, -scaleTopOffset(backCardScaleValue, cardHeight)],
    extrapolate: "clamp",
  });

  const incomingBackScale = stackProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, backCardScaleValue],
    extrapolate: "clamp",
  });

  const incomingBackOpacity = stackProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 1, 1],
    extrapolate: "clamp",
  });

  const likeOverlayOpacity = position.x.interpolate({
    inputRange: [0, cardWidth * 0.16, cardWidth * 0.42],
    outputRange: [0, 0.88, 1],
    extrapolate: "clamp",
  });

  const dislikeOverlayOpacity = position.x.interpolate({
    inputRange: [-cardWidth * 0.42, -cardWidth * 0.16, 0],
    outputRange: [1, 0.88, 0],
    extrapolate: "clamp",
  });

  const deckHeight = cardHeight + 22;

  const activeItem = deckItems[getNewsIndex(activeIndex, deckItems.length)];
  const middleItem = deckItems[getNewsIndex(activeIndex + directionOffset, deckItems.length)];
  const backItem = deckItems[getNewsIndex(activeIndex + directionOffset * 2, deckItems.length)];
  const incomingBackItem = deckItems[getNewsIndex(activeIndex + directionOffset * 3, deckItems.length)];

  return (
    <View style={{ alignItems: "center", width: cardWidth, height: deckHeight }}>
      <View style={{ position: "relative", width: cardWidth, height: deckHeight }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: cardWidth,
            alignItems: "center",
            opacity: incomingBackOpacity,
            zIndex: 0,
            transform: [{ translateY: incomingBackTranslateY }, { scale: incomingBackScale }],
          }}
        >
          <Card item={incomingBackItem} hideImage bookmarkedIds={bookmarkedIds} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: cardWidth,
            alignItems: "center",
            zIndex: 1,
            transform: [{ translateY: backCardTranslateY }, { scale: backCardScale }],
          }}
        >
          <Card item={backItem} hideImage bookmarkedIds={bookmarkedIds} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 10,
            width: cardWidth,
            alignItems: "center",
            zIndex: 2,
            transform: [{ translateY: middleCardTranslateY }, { scale: middleCardScale }],
          }}
        >
          <Card item={middleItem} hideImage bookmarkedIds={bookmarkedIds} />
        </Animated.View>
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: "absolute",
            left: 0,
            top: 22,
            width: cardWidth,
            alignItems: "center",
            zIndex: 3,
            transform: [{ translateX: position.x }, { translateY: position.y }, { rotate: activeTilt }, { scale: activeScale }],
          }}
        >
          <Pressable
            accessibilityRole="button"
            disabled={activeItem.type === "ad"}
            onPress={() => {
              if (activeItem.type === "issue") {
                onIssuePress?.(activeItem.issue);
              }
            }}
            style={{ position: "relative", width: "100%" }}
          >
            <Card item={activeItem} onReport={onReport} bookmarkedIds={bookmarkedIds} onBookmarkToggle={onBookmarkToggle} />
            <FeedbackOverlay direction={-1} opacity={dislikeOverlayOpacity} />
            <FeedbackOverlay direction={1} opacity={likeOverlayOpacity} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

export const SwipeableNewsDeck = React.forwardRef<SwipeableNewsDeckHandle, SwipeableNewsDeckProps>(SwipeableNewsDeckComponent);
