"use client";

import { useState, FormEvent } from "react";

interface SearchResult {
  title: string;
  url: string;
  description: string;
  score: number;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

interface SuccessData {
  results: SearchResult[];
  summary?: string;
  suggestions?: string[];
  rewrittenQuery?: string;
}

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; data: SuccessData }
  | { type: "error"; message: string };

type Freshness = "pd" | "pw" | "pm" | "py" | undefined;

const FRESHNESS_OPTIONS: { label: string; value: Freshness }[] = [
  { label: "Any time", value: undefined },
  { label: "Past 24h", value: "pd" },
  { label: "Past Week", value: "pw" },
  { label: "Past Month", value: "pm" },
  { label: "Past Year", value: "py" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [freshness, setFreshness] = useState<Freshness>(undefined);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function performSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, freshness }),
      });

      if (!res.ok) {
        const err: ErrorResponse = await res.json();
        setStatus({
          type: "error",
          message: err.error?.message ?? `Request failed (${res.status})`,
        });
        return;
      }

      const data: SuccessData = await res.json();
      setStatus({ type: "success", data });
    } catch {
      setStatus({
        type: "error",
        message: "Network error — could not reach the server",
      });
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    performSearch(query);
  }

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    performSearch(suggestion);
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-4 py-12 gap-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Search Dashboard</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Web search powered by Brave, re-ranked by relevance
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {FRESHNESS_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => setFreshness(opt.value)}
            className={
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors " +
              (freshness === opt.value
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a search query..."
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          disabled={status.type === "loading"}
        />
        <button
          type="submit"
          disabled={status.type === "loading" || !query.trim()}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status.type === "loading" ? "Searching..." : "Search"}
        </button>
      </form>

      {status.type === "loading" && (
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="inline-block w-4 h-4 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Searching...</span>
        </div>
      )}

      {status.type === "error" && (
        <div className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {status.message}
        </div>
      )}

      {status.type === "success" && (
        <div className="w-full space-y-4">
          {/* AI Summary card */}
          {status.data.summary && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                AI Summary
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {status.data.summary}
              </p>
              {status.data.rewrittenQuery &&
                status.data.rewrittenQuery !== query.trim() && (
                  <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 italic">
                    Showing results for: {status.data.rewrittenQuery}
                  </p>
                )}
            </div>
          )}

          {/* Suggestion buttons */}
          {status.data.suggestions && status.data.suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {status.data.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-blue-400 hover:text-blue-600 transition-colors dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:text-blue-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {status.data.results.length} result
            {status.data.results.length !== 1 ? "s" : ""}
          </p>

          {status.data.results.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              No results found.
            </p>
          ) : (
            <ul className="space-y-4">
              {status.data.results.map((r) => (
                <li
                  key={r.url}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {r.title}
                    </a>
                    <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                      {r.score}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2 dark:text-zinc-400">
                    {r.description}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400 truncate dark:text-zinc-500">
                    {r.url}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {status.type === "idle" && (
        <p className="text-zinc-400 dark:text-zinc-500 text-sm">
          Enter a query above to start searching
        </p>
      )}
    </div>
  );
}
