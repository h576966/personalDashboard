"use client";

import { useEffect, useState } from "react";
import NewsModule from "./NewsModule";
import SearchModule from "./SearchModule";
import SavedModule from "./SavedModule";
import { normalizeParam } from "@/lib/utils";
import { dashboardModules, type ActiveModule } from "./modules";

interface SearchResult {
  title: string;
  url: string;
  description: string;
  score: number;
}

interface SavedItem extends SearchResult {
  id: string;
}

interface SearchData {
  results: SearchResult[];
}

interface ErrorResponse {
  error?: {
    message?: string;
  };
}

export default function DashboardShell() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("news");

  const [query, setQuery] = useState("");
  const [freshness, setFreshness] = useState("");
  const [country, setCountry] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  useEffect(() => {
    loadSavedItems();
  }, []);

  async function loadSavedItems() {
    setIsLoadingSaved(true);
    try {
      const res = await fetch("/api/saved");
      const data = await res.json();
      setSavedItems(data.items ?? []);
    } catch {
      setSavedItems([]);
    } finally {
      setIsLoadingSaved(false);
    }
  }

  async function saveItem(item: SearchResult) {
    await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    await loadSavedItems();
  }

  async function removeItem(id: string) {
    await fetch(`/api/saved/${id}`, { method: "DELETE" });
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
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
        throw new Error(err.error?.message ?? "Search failed");
      }

      const data: SearchData = await res.json();
      setSearchData(data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
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
        <aside className="order-1 lg:order-2">
          <div className="rounded-md border p-3">
            <div className="flex flex-col gap-2">
              {dashboardModules.map((m) => (
                <button key={m.id} onClick={() => selectModule(m.id)}>
                  {m.title}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="order-2">
          {searchData && (
            <ul>
              {searchData.results.map((r) => (
                <li key={r.url}>
                  {r.title}
                  <button onClick={() => saveItem(r)}>Save</button>
                </li>
              ))}
            </ul>
          )}

          {!searchData && activeModule === "news" && <NewsModule />}

          {!searchData && activeModule === "saved" && (
            <SavedModule
              items={savedItems}
              isLoading={isLoadingSaved}
              onRemove={removeItem}
            />
          )}
        </main>
      </div>
    </div>
  );
}
