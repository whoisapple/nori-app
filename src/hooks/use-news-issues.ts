import React from "react";

import { fetchNewsIssues, mapIssuesToSearchResults } from "@/lib/news";
import type { NewsIssue } from "@/lib/news";

type Listener = (issues: NewsIssue[]) => void;

let cache: NewsIssue[] | null = null;
let inflight: Promise<NewsIssue[]> | null = null;
let cachedLimit = 0;
const listeners = new Set<Listener>();

function notify(issues: NewsIssue[]) {
  for (const listener of listeners) listener(issues);
}

async function loadIssues(limit: number, force: boolean): Promise<NewsIssue[]> {
  if (!force && cache && cachedLimit >= limit) return cache;
  if (inflight) return inflight;

  inflight = fetchNewsIssues(limit)
    .then((next) => {
      cache = next;
      cachedLimit = limit;
      notify(next);
      return next;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useNewsIssues(limit = 30) {
  const [issues, setIssues] = React.useState<NewsIssue[]>(() => cache ?? []);
  const [loading, setLoading] = React.useState(() => cache === null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(
    async (force = true) => {
      setError(null);
      if (!cache) setLoading(true);
      try {
        const next = await loadIssues(limit, force);
        setIssues(next);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "뉴스를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  React.useEffect(() => {
    const listener: Listener = (next) => setIssues(next);
    listeners.add(listener);

    if (!cache || cachedLimit < limit) {
      void refresh(false);
    } else {
      setIssues(cache);
      setLoading(false);
    }

    return () => {
      listeners.delete(listener);
    };
  }, [limit, refresh]);

  return {
    issues,
    searchResults: React.useMemo(() => mapIssuesToSearchResults(issues), [issues]),
    loading,
    error,
    refresh: () => refresh(true),
  };
}
