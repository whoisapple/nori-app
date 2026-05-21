import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageSourcePropType } from "react-native";

import { supabase } from "@/lib/supabase";
import type { IssueItem } from "@/types";

const DEFAULT_NEWS_IMAGE = "https://www.figma.com/api/mcp/asset/a726e1d9-a572-4cee-8e34-d30782a86f62";
const LEGACY_BOOKMARKS_KEY = "nori:bookmarked-issues";

type IssueBookmarkRow = {
  created_at: string;
  issues: IssueRow | IssueRow[] | null;
};

type IssueRow = {
  id: string;
  title: string;
  category: string;
  short_summary: string;
  full_text: string;
  created_at: string;
  published_at: string | null;
  source_count: number;
  sources: string[];
  importance_score: number;
  summary_10s: string | null;
  summary_30s: string | null;
  summary_1m: string | null;
  issue_articles?: IssueArticleRow[];
};

type IssueArticleRow = {
  articles: ArticleRow | ArticleRow[] | null;
};

type ArticleRow = {
  source: string;
  source_logo_url: string | null;
};

type LegacyStoredBookmark = {
  id: string;
};

export type BookmarkedIssue = IssueItem & {
  savedAt: string;
};

type BookmarkListener = () => void;

const listeners = new Set<BookmarkListener>();

function notifyBookmarksChanged() {
  listeners.forEach((listener) => listener());
}

function normalizeIssue(row: IssueBookmarkRow): IssueRow | null {
  if (Array.isArray(row.issues)) {
    return row.issues[0] ?? null;
  }

  return row.issues;
}

function normalizeArticle(row: IssueArticleRow): ArticleRow | null {
  if (Array.isArray(row.articles)) {
    return row.articles[0] ?? null;
  }

  return row.articles;
}

function mapBookmark(row: IssueBookmarkRow): BookmarkedIssue | null {
  const issue = normalizeIssue(row);

  if (!issue) {
    return null;
  }

  const articles = issue.issue_articles?.map(normalizeArticle).filter((article): article is ArticleRow => Boolean(article)) ?? [];
  const sourceNames = issue.sources.length > 0 ? issue.sources : Array.from(new Set(articles.map((article) => article.source)));
  const sourceLogos = Array.from(new Set(articles.map((article) => article.source_logo_url).filter((url): url is string => Boolean(url)))).map(
    (uri) => ({ uri }) satisfies ImageSourcePropType,
  );
  const reportCount = issue.source_count || sourceNames.length || articles.length || 1;
  const createdAt = issue.published_at ?? issue.created_at;
  const shortSummary = issue.summary_10s ?? issue.short_summary;

  return {
    id: issue.id,
    title: issue.title,
    shortSummary,
    fullText: issue.full_text ?? issue.summary_1m ?? issue.summary_30s ?? shortSummary,
    category: issue.category,
    reportCount,
    sources: sourceNames,
    createdAt,
    image: { uri: DEFAULT_NEWS_IMAGE },
    sourceLogos,
    featured: issue.importance_score > 0,
    savedAt: row.created_at,
  };
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user?.id ?? null;
}

async function migrateLegacyLocalBookmarks(userId: string) {
  const value = await AsyncStorage.getItem(LEGACY_BOOKMARKS_KEY);

  if (!value) {
    return;
  }

  const legacyBookmarks = JSON.parse(value) as LegacyStoredBookmark[];
  const rows = legacyBookmarks
    .map((bookmark) => bookmark.id)
    .filter(Boolean)
    .map((issueId) => ({
      user_id: userId,
      issue_id: issueId,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from("issue_bookmarks").upsert(rows, { onConflict: "user_id,issue_id" });

    if (error) {
      throw error;
    }
  }

  await AsyncStorage.removeItem(LEGACY_BOOKMARKS_KEY);
}

export function subscribeBookmarks(listener: BookmarkListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function getBookmarkedIssues(): Promise<BookmarkedIssue[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  await migrateLegacyLocalBookmarks(userId);

  const { data, error } = await supabase
    .from("issue_bookmarks")
    .select(
      "created_at,issues(id,title,category,short_summary,full_text,created_at,published_at,source_count,sources,importance_score,summary_10s,summary_30s,summary_1m,issue_articles(articles(source,source_logo_url)))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapBookmark(row as IssueBookmarkRow)).filter((bookmark): bookmark is BookmarkedIssue => Boolean(bookmark));
}

export async function getBookmarkedIssueIds(): Promise<Set<string>> {
  const bookmarks = await getBookmarkedIssues();
  return new Set(bookmarks.map((bookmark) => bookmark.id));
}

export async function isIssueBookmarked(issueId: string): Promise<boolean> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("issue_bookmarks")
    .select("issue_id")
    .eq("user_id", userId)
    .eq("issue_id", issueId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function addBookmarkedIssue(issue: IssueItem): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("로그인 후 북마크할 수 있어요.");
  }

  const { error } = await supabase.from("issue_bookmarks").upsert(
    {
      user_id: userId,
      issue_id: issue.id,
    },
    { onConflict: "user_id,issue_id" },
  );

  if (error) {
    throw error;
  }

  notifyBookmarksChanged();
}

export async function removeBookmarkedIssue(issueId: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase.from("issue_bookmarks").delete().eq("user_id", userId).eq("issue_id", issueId);

  if (error) {
    throw error;
  }

  notifyBookmarksChanged();
}

export async function toggleBookmarkedIssue(issue: IssueItem): Promise<boolean> {
  const bookmarked = await isIssueBookmarked(issue.id);

  if (bookmarked) {
    await removeBookmarkedIssue(issue.id);
    return false;
  }

  await addBookmarkedIssue(issue);
  return true;
}
