import { msHeadphones } from "@material-symbols-react-native/outlined-300/msHeadphones";
import { msIosShare } from "@material-symbols-react-native/outlined-300/msIosShare";
import { msThumbDownFill } from "@material-symbols-react-native/outlined-300/msThumbDownFill";
import { msThumbUpFill } from "@material-symbols-react-native/outlined-300/msThumbUpFill";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MsIcon } from "material-symbols-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/BottomNavigation";
import { ReportSheet, type ReportSheetTarget } from "@/components/ReportSheet";
import { HeaderSearchButton, SearchOverlay } from "@/components/SearchOverlay";
import { ShareSheet } from "@/components/ShareSheet";
import { HomeSkeleton } from "@/components/Skeleton";
import { SwipeableNewsDeck, type SwipeableNewsDeckHandle } from "@/components/SwipeableNewsDeck";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useNewsIssues } from "@/hooks/use-news-issues";
import { useSubscription } from "@/hooks/use-subscription";
import { useTodayBriefing } from "@/hooks/use-today-briefing";
import type { ShareableArticle } from "@/lib/share";
import type { IssueItem } from "@/types";

const FigmaColors = {
  backgroundBase: "#000000",
  backgroundDefaultDarker: "#f2f2fc",
  backgroundDefaultElevate: "#ffffff",
  iconPrimary: "#717181",
  iconNegative: "#f34026",
  iconPositive: "#3f6ef1",
  textDefaultHeading: "#303041",
  textDefaultPrimary: "#47475c",
};

const LOGO_URL = "https://www.figma.com/api/mcp/asset/aca68420-268f-4f46-a833-911ab0af89d2";

function getImageUrl(issue: IssueItem) {
  return typeof issue.image === "object" && issue.image && "uri" in issue.image ? issue.image.uri : undefined;
}

function getShareableArticle(issue: IssueItem): ShareableArticle {
  return {
    title: issue.title,
    description: issue.shortSummary,
    imageUrl: getImageUrl(issue),
    url: `https://nori.app/article/${issue.id}`,
  };
}

function Footer({
  activeIssue,
  onShare,
  onLike,
  onDislike,
}: {
  activeIssue?: IssueItem;
  onShare: (issue: IssueItem) => void;
  onLike: () => void;
  onDislike: () => void;
}) {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.footer}>
        <Pressable
          style={styles.shareButton}
          onPress={() => {
            if (activeIssue) {
              onShare(activeIssue);
            }
          }}
        >
          <View style={styles.shareButtonInner}>
            <MsIcon icon={msIosShare} size={28} color={FigmaColors.iconPrimary} />
          </View>
        </Pressable>
        <View style={styles.reactionButtons}>
          <Pressable accessibilityRole="button" accessibilityLabel="싫어요" onPress={onDislike} style={styles.dislikeBtn}>
            <MsIcon icon={msThumbDownFill} size={28} color={FigmaColors.iconNegative} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="좋아요" onPress={onLike} style={styles.likeBtn}>
            <MsIcon icon={msThumbUpFill} size={28} color={FigmaColors.iconPositive} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PodcastButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="팟캐스트로 듣기"
      onPress={onPress}
      style={({ pressed }) => [styles.podcastButton, pressed ? styles.podcastButtonPressed : null]}
    >
      <MsIcon icon={msHeadphones} size={20} color="#000000" />
      <Text style={styles.podcastButtonText}>팟캐스트로 듣기</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const deckRef = React.useRef<SwipeableNewsDeckHandle>(null);
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [activeIssue, setActiveIssue] = React.useState<IssueItem | undefined>();
  const [shareArticle, setShareArticle] = React.useState<ShareableArticle | null>(null);
  const [reportTarget, setReportTarget] = React.useState<ReportSheetTarget | null>(null);
  const { issues, searchResults, loading, error } = useNewsIssues();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const { session } = useAuthSession();
  const { isPro } = useSubscription({ userId: session?.user.id });
  useTodayBriefing();

  React.useEffect(() => {
    setActiveIssue((currentIssue) => currentIssue ?? issues[0]);
  }, [issues]);

  function openShareSheet(issue: IssueItem) {
    setShareArticle(getShareableArticle(issue));
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.contentWrapper}>
          <View style={styles.mainContent}>
            <SafeAreaView style={styles.topSafeArea} edges={["top"]}>
              <View style={styles.header}>
                <Image source={LOGO_URL} style={styles.logo} contentFit="contain" />
                <HeaderSearchButton onPress={() => setSearchVisible(true)} />
              </View>
              <View style={styles.centeredContent}>
                {issues.length > 0 ? (
                  <View style={styles.deckSection}>
                    <SwipeableNewsDeck
                      ref={deckRef}
                      items={issues}
                      onIssuePress={(issue) => router.push(`/article/${issue.id}`)}
                      onReport={(issue) => setReportTarget({ issueId: issue.id, title: issue.title })}
                      onActiveIssueChange={setActiveIssue}
                      bookmarkedIds={bookmarkedIds}
                      onBookmarkToggle={(issue) => {
                        void toggleBookmark(issue);
                      }}
                      hideAds={isPro}
                    />
                    <PodcastButton onPress={() => router.push("/briefing")} />
                  </View>
                ) : loading ? (
                  <HomeSkeleton />
                ) : (
                  <View style={styles.stateMessage}>
                    <Text style={styles.stateTitle}>뉴스가 없어요</Text>
                    <Text style={styles.stateDescription}>{error ?? "잠시 후 다시 확인해 주세요."}</Text>
                  </View>
                )}
                <Footer
                  activeIssue={activeIssue}
                  onShare={openShareSheet}
                  onDislike={() => deckRef.current?.react("dislike")}
                  onLike={() => deckRef.current?.react("like")}
                />
              </View>
            </SafeAreaView>
          </View>
          <BottomNavigation />
        </View>
        <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} items={searchResults} />
        <ShareSheet visible={Boolean(shareArticle)} article={shareArticle} onClose={() => setShareArticle(null)} />
        <ReportSheet visible={Boolean(reportTarget)} target={reportTarget} onClose={() => setReportTarget(null)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f2f2fc",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
    borderRadius: 56,
    overflow: "hidden",
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "column",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#f2f2fc",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topSafeArea: {
    flex: 1,
  },
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  deckSection: {
    alignItems: "center",
    gap: 10,
  },
  podcastButton: {
    marginTop: 16,
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingLeft: 20,
    paddingRight: 24,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "#ff9393",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  podcastButtonPressed: {
    opacity: 0.72,
  },
  podcastButtonText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: "#000000",
  },
  logo: {
    width: 34,
    height: 32,
  },
  stateMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#303041",
  },
  stateDescription: {
    marginTop: 8,
    fontSize: 14,
    color: "#69697c",
    textAlign: "center",
  },
  contentBlock: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  footerContainer: {
    paddingVertical: 8,
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  shareButton: {
    width: 76,
    height: 76,
    borderRadius: 1000,
    backgroundColor: "#f9f9ff",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  shareButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: "#f2f2fc",
    justifyContent: "center",
    alignItems: "center",
  },
  reactionButtons: {
    flexDirection: "row",
    gap: 4,
    width: 140,
    height: 76,
    padding: 8,
    borderRadius: 1000,
    backgroundColor: "#f9f9ff",
    justifyContent: "center",
    alignItems: "center",
  },
  dislikeBtn: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: "rgba(243, 64, 39, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  likeBtn: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: "rgba(63, 110, 241, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
