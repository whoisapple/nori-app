import type { ImageSourcePropType } from "react-native";

import type { SearchResultItem } from "@/constants/search";
import { supabase } from "@/lib/supabase";
import type { IssueItem } from "@/types";
import { formatDate, formatReportCount } from "@/utils/helpers";

const DEFAULT_NEWS_IMAGE = "https://www.figma.com/api/mcp/asset/a726e1d9-a572-4cee-8e34-d30782a86f62";

type IssueRow = {
  id: string;
  title: string;
  category: string;
  short_summary: string;
  importance: string;
  full_text: string;
  created_at: string;
  updated_at: string;
  keywords: string[];
  published_at: string | null;
  source_count: number;
  sources: string[];
  importance_score: number;
  summary_10s: string | null;
  summary_30s: string | null;
  summary_1m: string | null;
  why_it_matters: string | null;
  issue_articles?: IssueArticleRow[];
};

type IssueArticleRow = {
  articles: ArticleRow | ArticleRow[] | null;
};

type ArticleRow = {
  source: string;
  source_logo_url: string | null;
  published_at: string;
};

export type NewsIssue = IssueItem & {
  date: string;
  source: string;
};

function normalizeArticle(row: IssueArticleRow): ArticleRow | null {
  if (Array.isArray(row.articles)) {
    return row.articles[0] ?? null;
  }

  return row.articles;
}

function mapIssue(row: IssueRow): NewsIssue {
  const articles = row.issue_articles?.map(normalizeArticle).filter((article): article is ArticleRow => Boolean(article)) ?? [];
  const sourceNames = row.sources.length > 0 ? row.sources : Array.from(new Set(articles.map((article) => article.source)));
  const sourceLogos = Array.from(new Set(articles.map((article) => article.source_logo_url).filter((url): url is string => Boolean(url))))
    .map((uri) => ({ uri }) satisfies ImageSourcePropType);
  const reportCount = row.source_count || sourceNames.length || articles.length || 1;
  const createdAt = row.published_at ?? row.created_at;
  const shortSummary = row.summary_10s ?? row.short_summary;

  return {
    id: row.id,
    title: row.title,
    shortSummary,
    fullText: row.full_text ?? row.summary_1m ?? row.summary_30s ?? shortSummary,
    category: row.category,
    reportCount,
    sources: sourceNames,
    createdAt,
    date: formatDate(createdAt),
    source: formatReportCount(reportCount),
    image: { uri: DEFAULT_NEWS_IMAGE } satisfies ImageSourcePropType,
    sourceLogos,
    featured: row.importance_score > 0,
  };
}

export async function fetchNewsIssues(limit = 30): Promise<NewsIssue[]> {
  const { data: issues, error } = await supabase
    .from("issues")
    .select(
      "id,title,category,short_summary,importance,full_text,created_at,updated_at,keywords,source_count,sources,published_at,importance_score,summary_10s,summary_30s,summary_1m,why_it_matters,issue_articles(articles(source,source_logo_url,published_at))",
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return issues?.map(mapIssue) ?? [];
}

export async function fetchNewsIssue(id: string): Promise<NewsIssue | null> {
  const { data: issue, error } = await supabase
    .from("issues")
    .select(
      "id,title,category,short_summary,importance,full_text,created_at,updated_at,keywords,source_count,sources,published_at,importance_score,summary_10s,summary_30s,summary_1m,why_it_matters,issue_articles(articles(source,source_logo_url,published_at))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return issue ? mapIssue(issue) : null;
}

export function mapIssuesToSearchResults(issues: NewsIssue[]): SearchResultItem[] {
  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    summary: issue.shortSummary,
    category: issue.category,
    source: issue.source,
    sources: issue.sources,
    date: issue.date,
  }));
}
