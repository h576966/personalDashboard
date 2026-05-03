"use client";

import { useState, useEffect, useCallback } from "react";
import Briefing from "./Briefing";
import TopicsEditor from "./TopicsEditor";
import { type Status } from "./components/Status";
import { Button } from "@/components/ui/button";
import type { BriefingItem } from "@/lib/db/newsItems";

type Tab = "briefing" | "topics";

export default function NewsModule() {
  const [tab, setTab] = useState<Tab>("briefing");
  const [status, setStatus] = useState<Status<BriefingItem[]>>({ type: "loading" });
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const loadBriefing = useCallback(async () => {
    setStatus({ type: "loading" });
    try {
      const res = await fetch("/api/news/briefing");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setStatus({ type: "success", data: data.items ?? [] });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load briefing",
      });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBriefing();
  }, [loadBriefing]);

  async function handleFetchBriefing() {
    setFetching(true);
    try {
      const res = await fetch("/api/news/fetch", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to fetch news");
      }
      await loadBriefing();
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to fetch news",
      });
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
      setStatus((prev) =>
        prev.type === "success"
          ? { ...prev, data: prev.data.filter((item) => item.id !== id) }
          : prev,
      );
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
      setStatus((prev) =>
        prev.type === "success"
          ? { ...prev, data: prev.data.filter((item) => item.id !== id) }
          : prev,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save item",
      );
    }
  }

  const fetchButton = (
    <Button
      type="button"
      onClick={handleFetchBriefing}
      disabled={fetching}
      size="sm"
    >
      {fetching ? "Fetching..." : "Fetch briefing"}
    </Button>
  );

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-750 cursor-pointer"
      >
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          News Briefing
        </span>
        <div className="flex items-center gap-2">
          {fetchButton}
          <svg
            className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Collapsible body */}
      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          expanded ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          <div className="p-4">
            <div className="flex flex-col gap-4">
              {/* Tab bar */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setTab("briefing")}
                  className={
                    "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px " +
                    (tab === "briefing"
                      ? "border-primary text-primary dark:text-secondary"
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
                      ? "border-primary text-primary dark:text-secondary"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")
                  }
                >
                  Topics
                </button>
              </div>

              {/* Tab content */}
              {tab === "briefing" && (
                <>
                  {error && (
                    <div className="w-full rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
                      {error}
                    </div>
                  )}
                  <Briefing
                    status={status}
                    onDismiss={handleDismiss}
                    onSave={handleSave}
                    onRefresh={handleFetchBriefing}
                  />
                </>
              )}

              {tab === "topics" && <TopicsEditor />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
