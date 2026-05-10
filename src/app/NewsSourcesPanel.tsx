"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppCopy } from "@/lib/i18n";

interface NewsSource {
  id: string;
  name: string;
  domain: string;
  url: string;
  category: string;
  region: string;
  language: string;
  priority: number;
  enabled: boolean;
}

interface NewsSourcesResponse {
  sources?: NewsSource[];
  error?: string | {
    message?: string;
  };
}

interface NewsSourcesPanelProps {
  onChanged?: () => void;
  copy: AppCopy;
}

function groupKey(source: NewsSource): string {
  const category = source.category || "Other";
  const region = source.region || "Global";
  return `${category} / ${region}`;
}

function errorMessage(data: NewsSourcesResponse, fallback: string): string {
  return typeof data.error === "string"
    ? data.error
    : data.error?.message ?? fallback;
}

export default function NewsSourcesPanel({ onChanged, copy }: NewsSourcesPanelProps) {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupedSources = useMemo(() => {
    const groups = new Map<string, NewsSource[]>();

    for (const source of sources) {
      const key = groupKey(source);
      groups.set(key, [...(groups.get(key) ?? []), source]);
    }

    return [...groups.entries()];
  }, [sources]);

  const loadSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/news-sources");
      const data = (await res.json()) as NewsSourcesResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to load news sources"));
      setSources(data.sources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news sources");
      setSources([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function seedSources() {
    setIsSeeding(true);
    setError(null);

    try {
      const res = await fetch("/api/news-sources", { method: "POST" });
      const data = (await res.json()) as NewsSourcesResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to seed news sources"));
      setSources(data.sources ?? []);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed news sources");
    } finally {
      setIsSeeding(false);
    }
  }

  async function toggleSource(source: NewsSource) {
    setUpdatingId(source.id);
    setError(null);

    try {
      const res = await fetch(`/api/news-sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !source.enabled }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(errorMessage(data, "Failed to update news source"));

      setSources((prev) =>
        prev.map((item) => (item.id === data.source.id ? data.source : item)),
      );
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update news source");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSources();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSources]);

  return (
    <section className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {copy.newsSettings.trustedSources}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {copy.newsSettings.trustedSourcesDescription}
          </p>
        </div>

        {!isLoading && (
          <button
            type="button"
            onClick={seedSources}
            disabled={isSeeding}
            className="shrink-0 rounded-md border border-primary bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800"
          >
            {isSeeding
              ? copy.newsSettings.syncing
              : sources.length === 0
                ? copy.newsSettings.seedDefaults
                : copy.newsSettings.syncDefaults}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{copy.newsSettings.loadingSources}</p>
      ) : sources.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {copy.newsSettings.seedSourcesHint}
        </p>
      ) : (
        <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
          {groupedSources.map(([group, groupSources]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {group}
              </p>
              <div className="mt-2 space-y-2">
                {groupSources.map((source) => (
                  <label
                    key={source.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {source.name}
                      </span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {source.domain}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={source.enabled}
                      disabled={updatingId === source.id}
                      onChange={() => toggleSource(source)}
                      className="h-4 w-4 shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
