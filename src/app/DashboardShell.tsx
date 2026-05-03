"use client";

import { useState } from "react";
import NewsModule from "./NewsModule";
import SearchModule from "./SearchModule";
import { normalizeParam } from "@/lib/utils";

type ActiveModule = "news" | "saved";

interface SearchResult {
  title: string;
  url: string;
  description: string;
  score: number;
}

interface SearchData {
  results: SearchResult[];
  summary?: string;
  suggestions?: string[];
  rewrittenQuery?: string;
}

interface ErrorResponse {
  error?: {
    message?: string;
  };
}

const modules: Array<{
  id: ActiveModule;
  title: string;
  description: string;
}> = [
  {
    id: "news",
    title: "News",
    description: "Briefing and topics",
  },
  {
    id: "saved",
    title: "Saved",
    description: "Saved items and links",
  },
];

export default function DashboardShell() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("news");
  const [query, setQuery] = useState("");
  const [freshness, setFreshness] = useState("");
  const [country, setCountry] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchData(null);
    setSearchError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          freshness: normalizeParam(freshness),
          country: normalizeParam(country),
        }),
      });

      if (!res.ok) {
        const err: ErrorResponse = await res.json();
        throw new Error(err.error?.message ?? `Request failed (${res.status})`);
      }

      const data: SearchData = await res.json();
      setSearchData(data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    handleSearch(suggestion);
  }

  function selectModule(module: ActiveModule) {
    setActiveModule(module);
    setSearchData(null);
    setSearchError(null);
  }

  return (
    <div className="min-h-screen">
      <SearchModule
        query={query}
        freshness={freshness}
        country={country}
        isLoading={isSearching}
        onQueryChange={setQuery}
        onFreshnessChange={setFreshness}
        onCountryChange={setCountry}
        onSearch={handleSearch}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <aside className="order-1 lg:order-2 lg:border-l lg:border-zinc-200 lg:pl-6 dark:lg:border-zinc-700">
          <div className="w-full rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Modules
            </p>
            <div className="flex w-full gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {modules.map((module) => {
                const isActive = activeModule === module.id && !searchData && !searchError;
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => selectModule(module.id)}
                    className={
                      "w-full min-w-[160px] rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors lg:min-w-0 " +
                      (isActive
                        ? "border-primary bg-primary-hover text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")
                    }
                  >
                    <span className="block truncate">{module.title}</span>
                    <span className="mt-1 block truncate text-xs font-normal opacity-75">
                      {module.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="order-2 min-w-0 lg:order-1">
          {isSearching && (
            <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              Searching...
            </div>
          )}

          {!isSearching && searchError && (
            <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
              {searchError}
            </div>
          )}

          {!isSearching && searchData && (
            <div className="w-full space-y-4">
              {searchData.summary && (
                <div className="rounded-md border border-muted bg-muted p-4 dark:border-primary-hover dark:bg-primary-hover/20">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
                    AI Summary
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {searchData.summary}
                  </p>
                  {searchData.rewrittenQuery && searchData.rewrittenQuery !== query.trim() && (
                    <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 italic">
                      Showing results for: {searchData.rewrittenQuery}
                    </p>
                  )}
                </div>
              )}

              {searchData.suggestions && searchData.suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {searchData.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-secondary hover:text-primary transition-colors dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-primary dark:hover:text-secondary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {searchData.results.length} result{searchData.results.length !== 1 ? "s" : ""}
              </p>

              {searchData.results.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">No results found.</p>
              ) : (
                <ul className="space-y-4">
                  {searchData.results.map((r) => (
                    <li
                      key={r.url}
                      className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-medium text-zinc-900 hover:text-primary dark:text-zinc-100 dark:hover:text-secondary"
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

          {!isSearching && !searchData && !searchError && activeModule === "news" && <NewsModule />}

          {!isSearching && !searchData && !searchError && activeModule === "saved" && (
            <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Saved</p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Saved items will appear here later.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
