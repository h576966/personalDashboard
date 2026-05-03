"use client";

import { useState } from "react";
import NewsModule from "./NewsModule";
import SearchModule from "./SearchModule";
import { normalizeParam } from "@/lib/utils";
import { Bookmark, Newspaper } from "lucide-react";

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
  icon: any;
}> = [
  {
    id: "news",
    title: "News",
    description: "Briefing and topics",
    icon: Newspaper,
  },
  {
    id: "saved",
    title: "Saved",
    description: "Saved items and links",
    icon: Bookmark,
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
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Modules
              </p>
              {(searchData || searchError) && (
                <button
                  onClick={() => selectModule(activeModule)}
                  className="text-xs text-primary hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex w-full gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {modules.map((module) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id && !searchData && !searchError;

                return (
                  <button
                    key={module.id}
                    onClick={() => selectModule(module.id)}
                    className={
                      "group flex w-full min-w-[180px] items-center gap-3 rounded-md border px-3 py-2 text-left transition-all lg:min-w-0 " +
                      (isActive
                        ? "border-primary bg-primary-hover text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-primary hover:bg-muted/40 hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")
                    }
                  >
                    <div
                      className={
                        "flex h-8 w-8 items-center justify-center rounded-md border " +
                        (isActive
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-zinc-200 bg-zinc-50 text-primary group-hover:border-primary dark:border-zinc-700 dark:bg-zinc-800")
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{module.title}</div>
                      <div className="truncate text-xs opacity-75">{module.description}</div>
                    </div>
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
                </div>
              )}

              <ul className="space-y-4">
                {searchData.results.map((r) => (
                  <li key={r.url} className="rounded-md border bg-white p-4 shadow-sm">
                    <a href={r.url} className="font-medium">
                      {r.title}
                    </a>
                    <p className="text-sm text-zinc-500">{r.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isSearching && !searchData && !searchError && activeModule === "news" && <NewsModule />}

          {!isSearching && !searchData && !searchError && activeModule === "saved" && (
            <div className="rounded-md border bg-white p-6 shadow-sm">
              Saved module placeholder
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
