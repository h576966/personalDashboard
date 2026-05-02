"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardModule from "./DashboardModule";
import Briefing from "./Briefing";
import TopicsEditor from "./TopicsEditor";

interface BriefingItem {
  id: string;
  title: string;
  url: string;
  description: string;
  source: string;
  score: number;
  topicName: string;
  topicId: string;
  status: string;
  firstSeenAt: string;
}

type Tab = "briefing" | "topics";

export default function NewsModule() {
  const [tab, setTab] = useState<Tab>("briefing");
  const [items, setItems] = useState<BriefingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news/briefing");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load briefing",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBriefing();
  }, [loadBriefing]);

  async function handleFetchBriefing() {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/news/fetch", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to fetch news");
      }
      await loadBriefing();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch news",
      );
    } finally {
      setFetching(false);
    }
  }

  async function handleDismiss(id: string) {
    try {
      const res = await fetch(`/api/news/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      if (!res.ok) throw new Error("Failed to dismiss item");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to dismiss item",
      );
    }
  }

  async function handleSave(id: string) {
    try {
      const res = await fetch(`/api/news/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "saved" }),
      });
      if (!res.ok) throw new Error("Failed to save item");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save item",
      );
    }
  }

  const fetchButton = (
    <button
      type="button"
      onClick={handleFetchBriefing}
      disabled={fetching}
      className="rounded-md bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {fetching ? "Fetching..." : "Fetch briefing"}
    </button>
  );

  return (
    <DashboardModule
      title="News Briefing"
      defaultExpanded={true}
      actions={fetchButton}
    >
      <div className="flex flex-col gap-4">
        {/* Tab bar */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setTab("briefing")}
            className={
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px " +
              (tab === "briefing"
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")
            }
          >
            Briefing
          </button>
          <button
            type="button"
            onClick={() => setTab("topics")}
            className={
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px " +
              (tab === "topics"
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")
            }
          >
            Topics
          </button>
        </div>

        {/* Tab content */}
        {tab === "briefing" && (
          <Briefing
            items={items}
            loading={loading}
            error={error}
            onDismiss={handleDismiss}
            onSave={handleSave}
            onRefresh={handleFetchBriefing}
          />
        )}

        {tab === "topics" && <TopicsEditor />}
      </div>
    </DashboardModule>
  );
}
