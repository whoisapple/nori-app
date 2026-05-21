import React from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View, Text } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MsIcon } from "material-symbols-react-native";
import { msAccountCircle } from "@material-symbols-react-native/outlined-300/msAccountCircle";
import { msBookmarkFill } from "@material-symbols-react-native/outlined-300/msBookmarkFill";
import { msChevronRight } from "@material-symbols-react-native/outlined-300/msChevronRight";
import { msLogout } from "@material-symbols-react-native/outlined-300/msLogout";
import { msWorkspacePremium } from "@material-symbols-react-native/outlined-300/msWorkspacePremium";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HeaderSearchButton, SearchOverlay } from "@/components/SearchOverlay";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useNewsIssues } from "@/hooks/use-news-issues";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const router = useRouter();
  const [searchVisible, setSearchVisible] = React.useState(false);
  const { searchResults } = useNewsIssues();
  const { session, loading } = useAuthSession();
  const { isPro } = useSubscription({ userId: session?.user.id });
  const { bookmarks } = useBookmarks();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.mainContent}>
          <SafeAreaView style={styles.topSafeArea} edges={["top"]}>
            <View style={styles.header}>
              <Text style={styles.title}>프로필</Text>
              <HeaderSearchButton onPress={() => setSearchVisible(true)} />
            </View>
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.accountCard}>
                <View style={styles.accountIcon}>
                  <MsIcon icon={msAccountCircle} size={34} color="#303041" />
                </View>
                <View style={styles.accountText}>
                  <Text style={styles.accountLabel}>로그인 계정</Text>
                  <Text numberOfLines={1} style={styles.accountEmail}>
                    {loading ? "확인 중" : session?.user.email ?? "로그인이 필요해요"}
                  </Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" onPress={() => router.push("/paywall")} style={styles.subscriptionCard}>
                <View style={styles.subscriptionIcon}>
                  <MsIcon icon={msWorkspacePremium} size={28} color="#f9f9ff" />
                </View>
                <View style={styles.accountText}>
                  <Text style={styles.subscriptionLabel}>구독 상태</Text>
                  <Text style={styles.subscriptionTitle}>{isPro ? "NORI Pro 사용 중" : "NORI Pro 시작하기"}</Text>
                </View>
              </Pressable>
              <View style={styles.bookmarkSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <MsIcon icon={msBookmarkFill} size={20} color="#3f6ef1" />
                    <Text style={styles.sectionTitle}>북마크</Text>
                  </View>
                  <Text style={styles.bookmarkCount}>{bookmarks.length}개</Text>
                </View>
                {bookmarks.length > 0 ? (
                  bookmarks.slice(0, 5).map((bookmark) => (
                    <Pressable
                      key={bookmark.id}
                      accessibilityRole="button"
                      onPress={() => router.push(`/article/${bookmark.id}`)}
                      style={styles.bookmarkRow}
                    >
                      <Image source={bookmark.image} style={styles.bookmarkImage} contentFit="cover" />
                      <View style={styles.bookmarkText}>
                        <Text numberOfLines={2} style={styles.bookmarkTitle}>
                          {bookmark.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.bookmarkMeta}>
                          {bookmark.category} · {bookmark.reportCount}개 매체
                        </Text>
                      </View>
                      <MsIcon icon={msChevronRight} size={20} color="#babacc" />
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyBookmarks}>
                    <Text style={styles.emptyBookmarkTitle}>저장한 기사가 없어요</Text>
                    <Text style={styles.emptyBookmarkDescription}>마음에 드는 이슈를 북마크하면 여기에 모아둘게요.</Text>
                  </View>
                )}
              </View>
              <Pressable accessibilityRole="button" onPress={handleLogout} style={styles.logoutButton}>
                <MsIcon icon={msLogout} size={22} color="#f9f9ff" />
                <Text style={styles.logoutButtonText}>로그아웃</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
        <BottomNavigation />
        <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} items={searchResults} />
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
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#303041",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  accountCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
  },
  subscriptionCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#191927",
  },
  subscriptionIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#3f6ef1",
  },
  subscriptionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#babacc",
  },
  subscriptionTitle: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "800",
    color: "#f9f9ff",
  },
  accountIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#eeeefa",
  },
  accountText: {
    flex: 1,
    minWidth: 0,
  },
  accountLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#717181",
  },
  accountEmail: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "700",
    color: "#303041",
  },
  logoutButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 27,
    backgroundColor: "#191927",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f9f9ff",
  },
  bookmarkSection: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#303041",
  },
  bookmarkCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#717181",
  },
  bookmarkRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f2f2fc",
  },
  bookmarkImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#eeeefa",
  },
  bookmarkText: {
    flex: 1,
    minWidth: 0,
  },
  bookmarkTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#303041",
  },
  bookmarkMeta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    color: "#717181",
  },
  emptyBookmarks: {
    alignItems: "center",
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#f2f2fc",
  },
  emptyBookmarkTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#303041",
  },
  emptyBookmarkDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#717181",
    textAlign: "center",
  },
});
