"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppCopy } from "@/lib/i18n";

interface Topic {
  id: string;
  name: string;
}

interface TopicsResponse {
  topics?: Topic[];
  error?: string | {
    message?: string;
  };
}

function errorMessage(data: TopicsResponse, fallback: string): string {
  return typeof data.error === "string"
    ? data.error
    : data.error?.message ?? fallback;
}

export default function TopicsPanel({ copy }: { copy: AppCopy }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/topics");
      const data = (await res.json()) as TopicsResponse;
      if (!res.ok) throw new Error(errorMessage(data, "Failed to load interests"));
      setTopics(data.topics ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interests");
    }
  }, []);

  async function addTopic() {
    if (!newTopic.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTopic }),
      });
      const data = (await res.json()) as TopicsResponse;
      if (!res.ok) throw new Error(errorMessage(data, "Failed to add interest"));
      setNewTopic("");
      await loadTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add interest");
    } finally {
      setIsLoading(false);
    }
  }

  async function removeTopic(id: string) {
    try {
      const res = await fetch(`/api/topics/${id}`, { method: "DELETE" });
      const data = (await res.json()) as TopicsResponse;
      if (!res.ok) throw new Error(errorMessage(data, "Failed to remove interest"));
      await loadTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove interest");
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
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {copy.newsSettings.interests}
      </h3>

      <div className="mt-3 flex gap-2">
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder={copy.newsSettings.addInterest}
          className="flex-1 rounded-md border p-2 text-sm"
        />
        <button onClick={addTopic} disabled={isLoading} className="px-3 text-sm">
          {copy.newsSettings.add}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="mt-3 space-y-2">
        {topics.map((t) => (
          <div key={t.id} className="flex justify-between text-sm">
            <span>{t.name}</span>
            <button onClick={() => removeTopic(t.id)} className="text-xs text-red-500">
              {copy.newsSettings.remove.toLowerCase()}
            </button>
          </div>
        ))}
        {topics.length === 0 && !error && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {copy.newsSettings.loadingInterestsHint}
          </p>
        )}
      </div>
    </section>
  );
}
