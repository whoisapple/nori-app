import React from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/BottomNavigation";
import { GoogleNativeAdCard } from "@/components/GoogleNativeAdCard";
import { HeaderSearchButton, SearchOverlay } from "@/components/SearchOverlay";
import { CategorySkeleton } from "@/components/Skeleton";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useNewsIssues } from "@/hooks/use-news-issues";
import { useSubscription } from "@/hooks/use-subscription";
import type { NewsIssue } from "@/lib/news";

const categories = ["주요", "경제", "정치", "사회", "테크", "세계", "컬처"];
const ALL_CATEGORY = "주요";

function SourceLogoStack({ logos, labels, count, small = false }: { logos: ImageSourcePropType[]; labels: string[]; count: number; small?: boolean }) {
  const maxDisplay = small ? 3 : 5;
  const displayLogos = logos.slice(0, maxDisplay);
  const placeholderCount = logos.length > 0 ? 0 : Math.min(count, maxDisplay);
  const size = 16;

  return (
    <View style={articleStyles.avatarStack}>
      {displayLogos.map((source, index) => (
        <Image
          key={index}
          source={source}
          style={[
            small ? articleStyles.avatarSmall : articleStyles.avatar,
            index > 0 && (small ? articleStyles.avatarOverlapSmall : articleStyles.avatarOverlap),
          ]}
        />
      ))}
      {Array.from({ length: placeholderCount }).map((_, index) => (
        <View
          key={`${labels[index] ?? "source"}-${index}`}
          style={[
            small ? articleStyles.avatarSmall : articleStyles.avatar,
            index > 0 && (small ? articleStyles.avatarOverlapSmall : articleStyles.avatarOverlap),
            { alignItems: "center", justifyContent: "center", backgroundColor: "#f2f2fc" },
          ]}
        >
          <Text style={{ fontSize: 8, color: "#69697c", lineHeight: size }}>{(labels[index] ?? "매체").slice(0, 1).toUpperCase()}</Text>
        </View>
      ))}
      {count > displayLogos.length + placeholderCount && (
        <View style={[small ? articleStyles.avatarSmall : articleStyles.avatar, { alignItems: "center", justifyContent: "center", backgroundColor: "#f2f2fc" }]}>
          <Text style={{ fontSize: 8, color: "#69697c", lineHeight: size }}>{`+${count - displayLogos.length - placeholderCount}`}</Text>
        </View>
      )}
    </View>
  );
}

function CategoryTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={categoryStyles.tab}>
      <Text
        style={[
          categoryStyles.tabText,
          active ? categoryStyles.tabTextActive : categoryStyles.tabTextInactive,
        ]}
      >
        {label}
      </Text>
      {active && <View style={categoryStyles.tabUnderline} />}
    </Pressable>
  );
}

function ArticleCard({ article, featured }: { article: NewsIssue; featured: boolean }) {
  if (featured) {
    return (
      <View style={articleStyles.largeCard}>
        <Image source={article.image} style={articleStyles.largeImage} contentFit="cover" />
        <Text style={articleStyles.title}>{article.title}</Text>
        <View style={articleStyles.metaRow}>
          <SourceLogoStack logos={article.sourceLogos} labels={article.sources} count={article.reportCount} />
          <Text style={articleStyles.reportCount}>{article.source}</Text>
          <Text style={articleStyles.date}>{article.date}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={articleStyles.horizontalCard}>
      <View style={articleStyles.horizontalContent}>
        <Text style={articleStyles.title} numberOfLines={2}>{article.title}</Text>
        <View style={articleStyles.metaRow}>
          <SourceLogoStack logos={article.sourceLogos} labels={article.sources} count={article.reportCount} small />
          <Text style={articleStyles.reportCountSmall}>{article.source}</Text>
          <Text style={articleStyles.dateSmall}>{article.date}</Text>
        </View>
      </View>
      <Image source={article.image} style={articleStyles.thumbnail} contentFit="cover" />
    </View>
  );
}

export default function CategoryScreen() {
  const router = useRouter();
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<string>(ALL_CATEGORY);
  const { issues, searchResults, loading, error } = useNewsIssues();
  const { session } = useAuthSession();
  const { isPro } = useSubscription({ userId: session?.user.id });

  const filteredIssues = React.useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return issues;
    return issues.filter((issue) => issue.category === activeCategory);
  }, [activeCategory, issues]);

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.mainContent}>
          <SafeAreaView style={styles.topSafeArea} edges={["top"]}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>카테고리</Text>
              <HeaderSearchButton onPress={() => setSearchVisible(true)} />
            </View>

            <View style={styles.categoryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {categories.map((cat) => (
                  <CategoryTab key={cat} label={cat} active={cat === activeCategory} onPress={() => setActiveCategory(cat)} />
                ))}
              </ScrollView>
            </View>

            <ScrollView style={styles.contentBlock} showsVerticalScrollIndicator={false}>
              {filteredIssues.length > 0 ? (
                filteredIssues.map((article, index) => (
                  <React.Fragment key={article.id}>
                    <Pressable accessibilityRole="button" onPress={() => router.push(`/article/${article.id}`)}>
                      <ArticleCard article={article} featured={index === 0} />
                    </Pressable>
                    {!isPro && index === 0 ? <GoogleNativeAdCard variant="list" /> : null}
                  </React.Fragment>
                ))
              ) : loading ? (
                <CategorySkeleton />
              ) : (
                <View style={styles.stateMessage}>
                  <Text style={styles.stateTitle}>뉴스가 없어요</Text>
                  <Text style={styles.stateDescription}>
                    {error ?? (activeCategory === ALL_CATEGORY ? "잠시 후 다시 확인해 주세요." : `${activeCategory} 카테고리의 이슈가 아직 없어요.`)}
                  </Text>
                </View>
              )}
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
    backgroundColor: "#f9f9ff",
  },
  container: {
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
  headerTitle: {
    fontSize: 25,
    fontWeight: "600",
    color: "#191927",
    letterSpacing: -0.5,
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#eeeefa",
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  contentBlock: {
    flex: 1,
  },
  stateMessage: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 96,
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

const categoryStyles = StyleSheet.create({
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 17,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#303041",
    fontWeight: "600",
  },
  tabTextInactive: {
    color: "#717181",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#303041",
  },
});

const articleStyles = StyleSheet.create({
  largeCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeefa",
  },
  largeImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginBottom: 8,
  },
  horizontalCard: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeefa",
    gap: 12,
  },
  horizontalContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 17,
    fontWeight: "500",
    color: "#303041",
    lineHeight: 27,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarStack: {
    flexDirection: "row",
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: -4,
  },
  avatarOverlap: {
    marginLeft: 0,
  },
  avatarSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: -4,
  },
  avatarOverlapSmall: {
    marginLeft: 0,
  },
  reportCount: {
    flex: 1,
    fontSize: 13,
    color: "#69697c",
  },
  reportCountSmall: {
    fontSize: 13,
    color: "#69697c",
  },
  date: {
    fontSize: 13,
    color: "#69697c",
  },
  dateSmall: {
    fontSize: 13,
    color: "#69697c",
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eeeefa",
  },
});
