"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppCopy } from "@/lib/i18n";

interface MutedTopic {
  id: string;
  label: string;
  keywords: string[];
  enabled: boolean;
}

interface MutedTopicsResponse {
  topics?: MutedTopic[];
  topic?: MutedTopic;
  error?: string | {
    message?: string;
  };
}

interface MutedTopicsPanelProps {
  onChanged?: () => void;
  copy: AppCopy;
}

export default function MutedTopicsPanel({ onChanged, copy }: MutedTopicsPanelProps) {
  const [topics, setTopics] = useState<MutedTopic[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function errorMessage(data: MutedTopicsResponse, fallback: string): string {
    return typeof data.error === "string"
      ? data.error
      : data.error?.message ?? fallback;
  }

  const loadTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/news-blocked-topics");
      const data = (await res.json()) as MutedTopicsResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to load muted topics"));
      setTopics(data.topics ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load muted topics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function addTopic() {
    const label = newLabel.trim();
    if (!label) return;

    setUpdatingId("new");
    setError(null);

    try {
      const res = await fetch("/api/news-blocked-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, keywords: label }),
      });
      const data = (await res.json()) as MutedTopicsResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to save muted topic"));
      if (data.topic) setTopics((prev) => [...prev, data.topic!].sort((a, b) => a.label.localeCompare(b.label)));
      setNewLabel("");
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save muted topic");
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleTopic(topic: MutedTopic) {
    setUpdatingId(topic.id);
    setError(null);

    try {
      const res = await fetch(`/api/news-blocked-topics/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !topic.enabled }),
      });
      const data = (await res.json()) as MutedTopicsResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to update muted topic"));
      if (data.topic) {
        setTopics((prev) => prev.map((item) => (item.id === data.topic!.id ? data.topic! : item)));
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update muted topic");
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
          {copy.newsSettings.mutedTopics}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {copy.newsSettings.mutedTopicsDescription}
        </p>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder={copy.newsSettings.muteTopic}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={addTopic}
          disabled={updatingId === "new"}
          className="rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
        >
          {copy.newsSettings.add}
        </button>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{copy.newsSettings.loadingMutedTopics}</p>
      ) : topics.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {copy.newsSettings.mutedTopicsHint}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {topics.map((topic) => (
            <label
              key={topic.id}
              className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {topic.label}
                </span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {topic.keywords.join(", ")}
                </span>
              </span>
              <input
                type="checkbox"
                checked={topic.enabled}
                disabled={updatingId === topic.id}
                onChange={() => toggleTopic(topic)}
                className="h-4 w-4 shrink-0"
              />
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
