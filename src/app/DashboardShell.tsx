"use client";

import { useState } from "react";
import NewsModule from "./NewsModule";
import SearchModule from "./SearchModule";
import SavedModule from "./SavedModule";
import { normalizeParam } from "@/lib/utils";
import { Bookmark, Newspaper } from "lucide-react";

// (rest unchanged above)

export default function DashboardShell() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("news");
  const [query, setQuery] = useState("");
  const [freshness, setFreshness] = useState("");
  const [country, setCountry] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [savedItems, setSavedItems] = useState<SearchResult[]>([]);

  function saveItem(item: SearchResult) {
    setSavedItems((prev) => {
      if (prev.find((i) => i.url === item.url)) return prev;
      return [item, ...prev];
    });
  }

  function removeItem(url: string) {
    setSavedItems((prev) => prev.filter((i) => i.url !== url));
  }

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
        {/* sidebar unchanged */}

        <main className="order-2 min-w-0 lg:order-1">
          {isSearching && <div className="p-4">Searching...</div>}

          {!isSearching && searchError && <div className="p-4 text-red-600">{searchError}</div>}

          {!isSearching && searchData && (
            <ul className="space-y-4">
              {searchData.results.map((r) => (
                <li key={r.url} className="border p-4">
                  <div className="flex justify-between gap-2">
                    <a href={r.url} className="font-medium">
                      {r.title}
                    </a>
                    <button
                      onClick={() => saveItem(r)}
                      className="text-xs text-primary"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-sm text-zinc-500">{r.description}</p>
                </li>
              ))}
            </ul>
          )}

          {!isSearching && !searchData && !searchError && activeModule === "news" && <NewsModule />}

          {!isSearching && !searchData && !searchError && activeModule === "saved" && (
            <SavedModule items={savedItems} onRemove={removeItem} />
          )}
        </main>
      </div>
    </div>
  );
}
