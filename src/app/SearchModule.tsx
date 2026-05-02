"use client";

import { useState } from "react";

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

const COUNTRY_OPTIONS = [
  { label: "Global", value: "" },
  { label: "United States", value: "US" },
  { label: "United Kingdom", value: "GB" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Japan", value: "JP" },
  { label: "Canada", value: "CA" },
  { label: "Australia", value: "AU" },
  { label: "India", value: "IN" },
  { label: "Sweden", value: "SE" },
  { label: "Norway", value: "NO" },
];

export default function SearchModule() {
  const [query, setQuery] = useState("");
  const [freshness, setFreshness] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function performSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          freshness: freshness || undefined,
          country: country || undefined,
        }),
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

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    performSearch(suggestion);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch(query);
    }
  }

  return (
    <>
      <div className="bg-teal-900 dark:bg-teal-950 border-b border-teal-700 dark:border-teal-800">
        <div className="flex flex-wrap items-center gap-2 mx-auto max-w-5xl px-4 py-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="flex-1 min-w-0 rounded-md border border-teal-600 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            disabled={status.type === "loading"}
          />
          <button
            type="button"
            onClick={() => performSearch(query)}
            disabled={!query.trim() || status.type === "loading"}
            className="rounded-md bg-teal-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status.type === "loading" ? "..." : "Go"}
          </button>
            {/* Freshness */}
          <div className="flex items-center gap-1">
            <span className="text-teal-300">
              <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>
            <select
              value={freshness}
              onChange={(e) => setFreshness(e.target.value)}
              disabled={status.type === "loading"}
              className="rounded-md bg-teal-800 dark:bg-teal-900 border border-teal-600 dark:border-teal-700 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer appearance-[base]"
            >
              <option value="" className="bg-teal-800 text-teal-100 hover:bg-teal-600 hover:text-white">Any time</option>
              <option value="pd" className="bg-teal-800 text-teal-100 hover:bg-teal-600 hover:text-white">Past Day</option>
              <option value="pw" className="bg-teal-800 text-teal-100 hover:bg-teal-600 hover:text-white">Past Week</option>
              <option value="pm" className="bg-teal-800 text-teal-100 hover:bg-teal-600 hover:text-white">Past Month</option>
              <option value="py" className="bg-teal-800 text-teal-100 hover:bg-teal-600 hover:text-white">Past Year</option>
            </select>
          </div>
            {/* Region */}
          <div className="flex items-center gap-1">
            <span className="text-teal-300">
              <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={status.type === "loading"}
              className="rounded-md bg-teal-800 dark:bg-teal-900 border border-teal-600 dark:border-teal-700 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer appearance-[base]"
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value} className="bg-teal-800 text-teal-100 hover:bg-teal-600 hover:text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>
      {status.type !== "idle" && (
        <div className="max-w-5xl mx-auto px-6 pb-8 pt-6">
          {status.type === "loading" && (
            <div className="flex items-center gap-2 text-zinc-500">
              <span className="inline-block w-4 h-4 border-2 border-zinc-300 border-t-teal-600 rounded-full animate-spin" />
              <span>Searching...</span>
            </div>
          )}

          {status.type === "error" && (
            <div className="w-full rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
              {status.message}
            </div>
          )}

          {status.type === "success" && (
            <div className="w-full space-y-4">
              {status.data.summary && (
                <div className="rounded-md border border-teal-100 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/20">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400">
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

              {status.data.suggestions &&
                status.data.suggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {status.data.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-teal-500 hover:text-teal-700 transition-colors dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-teal-600 dark:hover:text-teal-400"
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
                      className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-medium text-zinc-900 hover:text-teal-700 dark:text-zinc-100 dark:hover:text-teal-500"
                        >
                          {r.title}
                        </a>
                        <span className="shrink-0 rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
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
        </div>
      )}
    </>
  );
}
