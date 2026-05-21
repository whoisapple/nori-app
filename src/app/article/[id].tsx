import { msAutoAwesomeMotion } from "@material-symbols-react-native/outlined-300/msAutoAwesomeMotion";
import { msBookmark } from "@material-symbols-react-native/outlined-300/msBookmark";
import { msBookmarkFill } from "@material-symbols-react-native/outlined-300/msBookmarkFill";
import { msClose } from "@material-symbols-react-native/outlined-300/msClose";
import { msFlag } from "@material-symbols-react-native/outlined-300/msFlag";
import { msIosShare } from "@material-symbols-react-native/outlined-300/msIosShare";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MsIcon } from "material-symbols-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReportSheet, type ReportSheetTarget } from "@/components/ReportSheet";
import { ShareSheet } from "@/components/ShareSheet";
import { ArticleDetailSkeleton } from "@/components/Skeleton";
import { SourceStack } from "@/components/SourceStack";
import { useBookmarks } from "@/hooks/use-bookmarks";
import type { NewsIssue } from "@/lib/news";
import { fetchNewsIssue } from "@/lib/news";
import type { ShareableArticle } from "@/lib/share";

const DEFAULT_SOURCE = "연합뉴스";

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [issue, setIssue] = React.useState<NewsIssue | null>(null);
  const [shareArticle, setShareArticle] = React.useState<ShareableArticle | null>(null);
  const [reportTarget, setReportTarget] = React.useState<ReportSheetTarget | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  React.useEffect(() => {
    let mounted = true;

    async function loadIssue() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const nextIssue = await fetchNewsIssue(id);
        if (mounted) setIssue(nextIssue);
      } catch (nextError) {
        if (mounted) setError(nextError instanceof Error ? nextError.message : "기사 정보를 불러오지 못했어요.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadIssue();

    return () => {
      mounted = false;
    };
  }, [id]);

  const sourceLabel = issue?.sources[0] ?? DEFAULT_SOURCE;
  const bodyText = issue?.fullText ?? "";
  const imageUrl = typeof issue?.image === "object" && issue.image && "uri" in issue.image ? issue.image.uri : undefined;
  const bookmarked = issue ? bookmarkedIds.has(issue.id) : false;

  return (
    <View style={styles.screen}>
      <View style={styles.frame}>
        <View style={styles.mainContent}>
          <SafeAreaView edges={["top"]} style={styles.topSafeArea}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel="상세 닫기" onPress={() => router.back()} style={styles.closeButton}>
                <MsIcon icon={msClose} size={24} color="#717181" />
              </Pressable>
            </View>

            {issue ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroBlock}>
                  <Image source={issue.image} style={styles.heroImage} contentFit="cover" />
                  <Text style={styles.imageSource}>출처 : {sourceLabel}</Text>
                </View>

                <View style={styles.articleContent}>
                  <View style={styles.metaHeader}>
                    <SourceStack images={issue.sourceLogos} labels={issue.sources} count={issue.reportCount} size={32} overlap={12} maxDisplay={4} />
                    <Text style={styles.reportCount}>{issue.source}</Text>
                  </View>

                  <Text style={styles.title}>{issue.title}</Text>

                  <View style={styles.summaryBlock}>
                    <View style={styles.summaryRail} />
                    <Text style={styles.summaryText}>{issue.shortSummary}</Text>
                  </View>

                  <Text style={styles.bodyText}>{bodyText}</Text>
                </View>
              </ScrollView>
            ) : loading ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <ArticleDetailSkeleton />
              </ScrollView>
            ) : (
              <View style={styles.stateMessage}>
                <Text style={styles.stateTitle}>기사를 찾을 수 없어요</Text>
                <Text style={styles.stateDescription}>{error ?? "목록에서 다시 선택해 주세요."}</Text>
              </View>
            )}
          </SafeAreaView>
        </View>

        <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
          <View style={styles.bottomActions}>
            <View style={styles.leftActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="신고"
                style={styles.actionButton}
                onPress={() => {
                  if (issue) {
                    setReportTarget({ issueId: issue.id, title: issue.title });
                  }
                }}
              >
                <MsIcon icon={msFlag} size={24} color="#babacc" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={bookmarked ? "북마크 해제" : "북마크"}
                style={styles.actionButton}
                onPress={() => {
                  if (issue) {
                    void toggleBookmark(issue);
                  }
                }}
              >
                <MsIcon icon={bookmarked ? msBookmarkFill : msBookmark} size={24} color={bookmarked ? "#f9f9ff" : "#babacc"} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="공유"
                style={styles.actionButton}
                onPress={() => {
                  if (issue) {
                    setShareArticle({
                      title: issue.title,
                      description: issue.shortSummary,
                      imageUrl,
                      url: `https://nori.app/article/${issue.id}`,
                    });
                  }
                }}
              >
                <MsIcon icon={msIosShare} size={24} color="#babacc" />
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="AI 요약" style={styles.actionButton}>
              <MsIcon icon={msAutoAwesomeMotion} size={24} color="#babacc" />
            </Pressable>
          </View>
        </SafeAreaView>
        <ShareSheet visible={Boolean(shareArticle)} article={shareArticle} onClose={() => setShareArticle(null)} />
        <ReportSheet visible={Boolean(reportTarget)} target={reportTarget} onClose={() => setReportTarget(null)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },
  frame: {
    flex: 1,
    backgroundColor: "#000000",
    borderRadius: 56,
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#f9f9ff",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  topSafeArea: {
    flex: 1,
  },
  header: {
    height: 52,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#eeeefa",
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingBottom: 16,
  },
  heroBlock: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
  },
  imageSource: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "500",
    color: "#717181",
  },
  articleContent: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  reportCount: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
    color: "#69697c",
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: "600",
    color: "#191927",
  },
  summaryBlock: {
    flexDirection: "row",
    gap: 8,
  },
  summaryRail: {
    width: 2,
    alignSelf: "stretch",
    backgroundColor: "#3f6ef1",
  },
  summaryText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 29,
    fontWeight: "600",
    color: "#303041",
  },
  bodyText: {
    fontSize: 17,
    lineHeight: 29,
    fontWeight: "500",
    color: "#47475c",
  },
  bottomBar: {
    backgroundColor: "#000000",
  },
  bottomActions: {
    height: 61,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
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
});
