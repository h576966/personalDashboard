"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppCopy } from "@/lib/i18n";

interface WatchTopic {
  id: string;
  name: string;
  queries: string[];
  sourceDomains: string[];
  enabled: boolean;
}

interface WatchTopicsResponse {
  topics?: WatchTopic[];
  topic?: WatchTopic;
  error?: string | {
    message?: string;
  };
}

interface WatchTopicsPanelProps {
  onChanged?: () => void;
  copy: AppCopy;
}

function errorMessage(data: WatchTopicsResponse, fallback: string): string {
  return typeof data.error === "string"
    ? data.error
    : data.error?.message ?? fallback;
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .flatMap((line) => line.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function WatchTopicsPanel({ onChanged, copy }: WatchTopicsPanelProps) {
  const [topics, setTopics] = useState<WatchTopic[]>([]);
  const [name, setName] = useState("");
  const [queries, setQueries] = useState("");
  const [domains, setDomains] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/news-watch-topics");
      const data = (await res.json()) as WatchTopicsResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to load watch topics"));
      setTopics(data.topics ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watch topics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function addTopic() {
    const trimmedName = name.trim();
    const parsedQueries = splitLines(queries);
    if (!trimmedName || parsedQueries.length === 0) return;

    setUpdatingId("new");
    setError(null);

    try {
      const res = await fetch("/api/news-watch-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          queries: parsedQueries,
          sourceDomains: splitLines(domains),
        }),
      });
      const data = (await res.json()) as WatchTopicsResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to save watch topic"));
      if (data.topic) setTopics((prev) => [...prev, data.topic!]);
      setName("");
      setQueries("");
      setDomains("");
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save watch topic");
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleTopic(topic: WatchTopic) {
    setUpdatingId(topic.id);
    setError(null);

    try {
      const res = await fetch(`/api/news-watch-topics/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !topic.enabled }),
      });
      const data = (await res.json()) as WatchTopicsResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to update watch topic"));
      if (data.topic) {
        setTopics((prev) => prev.map((item) => (item.id === data.topic!.id ? data.topic! : item)));
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update watch topic");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeTopic(topic: WatchTopic) {
    setUpdatingId(topic.id);
    setError(null);

    try {
      const res = await fetch(`/api/news-watch-topics/${topic.id}`, { method: "DELETE" });
      const data = (await res.json()) as WatchTopicsResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to delete watch topic"));
      setTopics((prev) => prev.filter((item) => item.id !== topic.id));
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete watch topic");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTopics();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTopics]);

  return (
    <section className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {copy.newsSettings.watchTopics}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {copy.newsSettings.watchTopicsDescription}
        </p>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={copy.newsSettings.watchTopicName}
          className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <textarea
          value={queries}
          onChange={(event) => setQueries(event.target.value)}
          rows={2}
          placeholder={copy.newsSettings.searchTerms}
          className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <textarea
          value={domains}
          onChange={(event) => setDomains(event.target.value)}
          rows={2}
          placeholder={copy.newsSettings.sourceDomains}
          className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={addTopic}
          disabled={updatingId === "new" || !name.trim() || splitLines(queries).length === 0}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
        >
          {updatingId === "new" ? copy.newsSettings.adding : copy.newsSettings.addWatchTopic}
        </button>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{copy.newsSettings.loadingWatchTopics}</p>
      ) : topics.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {copy.newsSettings.watchTopicsHint}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {topic.name}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {topic.queries.join(", ")}
                  </span>
                  {topic.sourceDomains.length > 0 && (
                    <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">
                      {topic.sourceDomains.join(", ")}
                    </span>
                  )}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={topic.enabled}
                    disabled={updatingId === topic.id}
                    onChange={() => toggleTopic(topic)}
                    className="h-4 w-4"
                  />
                  <button
                    type="button"
                    onClick={() => removeTopic(topic)}
                    disabled={updatingId === topic.id}
                    className="text-xs font-medium text-zinc-400 hover:text-red-600 disabled:opacity-50"
                  >
                    {copy.newsSettings.remove}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
