import React from "react";

import {
  getBookmarkedIssues,
  subscribeBookmarks,
  toggleBookmarkedIssue,
  type BookmarkedIssue,
} from "@/lib/bookmarks";
import { supabase } from "@/lib/supabase";
import type { IssueItem } from "@/types";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = React.useState<BookmarkedIssue[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setError(null);

    try {
      const nextBookmarks = await getBookmarkedIssues();
      setBookmarks(nextBookmarks);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "북마크를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    return subscribeBookmarks(() => {
      void refresh();
    });
  }, [refresh]);

  const bookmarkedIds = React.useMemo(() => new Set(bookmarks.map((bookmark) => bookmark.id)), [bookmarks]);

  const toggleBookmark = React.useCallback(
    async (issue: IssueItem) => {
      const nextBookmarked = await toggleBookmarkedIssue(issue);
      await refresh();
      return nextBookmarked;
    },
    [refresh],
  );

  React.useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      void refresh();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  return {
    bookmarks,
    bookmarkedIds,
    loading,
    error,
    refresh,
    toggleBookmark,
  };
}
