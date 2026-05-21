import { msArticle } from "@material-symbols-react-native/outlined-300/msArticle";
import { msClose } from "@material-symbols-react-native/outlined-300/msClose";
import { msSearch } from "@material-symbols-react-native/outlined-300/msSearch";
import { useRouter } from "expo-router";
import { MsIcon } from "material-symbols-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SearchResultItem } from "@/constants/search";

type SearchOverlayProps = {
  visible: boolean;
  onClose: () => void;
  items: SearchResultItem[];
};

export function SearchOverlay({ visible, onClose, items }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return items;

    return items.filter((item) => {
      const searchableText = [item.title, item.summary, item.category, item.source, item.date, ...(item.sources ?? [])].join(" ").toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [items, normalizedQuery]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handleResultPress = (item: SearchResultItem) => {
    setQuery("");
    onClose();
    router.push(`/article/${item.id}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
      onShow={() => inputRef.current?.focus()}
    >
      <View style={styles.screen}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <View style={styles.searchBox}>
              <MsIcon icon={msSearch} size={24} color="#69697c" />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="뉴스, 카테고리, 키워드 검색"
                placeholderTextColor="#8d8da3"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={styles.input}
              />
              {query.length > 0 && (
                <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => setQuery("")} style={styles.clearButton}>
                  <MsIcon icon={msClose} size={20} color="#69697c" />
                </Pressable>
              )}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="검색 닫기" onPress={handleClose} style={styles.closeButton}>
              <MsIcon icon={msClose} size={24} color="#303041" />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.results}>
            <Text style={styles.resultCount}>{normalizedQuery ? `${results.length}개 결과` : "최근 이슈"}</Text>
            {results.length > 0 ? (
              results.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  onPress={() => handleResultPress(item)}
                  style={styles.resultItem}
                >
                  <View style={styles.resultIcon}>
                    <MsIcon icon={msArticle} size={22} color="#3f6ef1" />
                  </View>
                  <View style={styles.resultBody}>
                    <View style={styles.metaRow}>
                      <Text style={styles.category}>{item.category}</Text>
                      <Text style={styles.date}>{item.date}</Text>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.summary} numberOfLines={2}>
                      {item.summary}
                    </Text>
                    <Text style={styles.source}>{item.source}</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
                <Text style={styles.emptyDescription}>다른 키워드나 카테고리로 다시 찾아보세요.</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function HeaderSearchButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="검색 열기" onPress={onPress} style={styles.headerSearchButton}>
      <MsIcon icon={msSearch} size={26} color="#303041" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeefa",
  },
  searchBox: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#f2f2fc",
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    color: "#303041",
    paddingVertical: 10,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  results: {
    paddingBottom: 28,
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#69697c",
  },
  resultItem: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeefa",
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(63, 110, 241, 0.12)",
  },
  resultBody: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3f6ef1",
  },
  date: {
    fontSize: 13,
    color: "#8d8da3",
  },
  title: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    color: "#303041",
  },
  summary: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: "#69697c",
  },
  source: {
    marginTop: 8,
    fontSize: 13,
    color: "#717181",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 96,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#303041",
  },
  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    color: "#69697c",
    textAlign: "center",
  },
  headerSearchButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
