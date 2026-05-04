"use client";

import { useCallback, useMemo, useState } from "react";
import NewsBriefingModule from "./NewsBriefingModule";
import NotesModule from "./NotesModule";
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
  source?: string;
  created_at?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
}

interface SearchData {
  results: SearchResult[];
  summary?: string;
  suggestions?: string[];
  rewrittenQuery?: string;
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
  const [savedError, setSavedError] = useState<string | null>(null);
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [hasLoadedNotes, setHasLoadedNotes] = useState(false);

  const savedUrls = useMemo(
    () => new Set(savedItems.map((item) => item.url)),
    [savedItems],
  );

  const loadSavedItems = useCallback(async () => {
    if (hasLoadedSaved || isLoadingSaved) return;

    setIsLoadingSaved(true);
    setSavedError(null);

    try {
      const res = await fetch("/api/saved");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to load saved items");
      }

      setSavedItems(data.items ?? []);
      setHasLoadedSaved(true);
    } catch (err) {
      setSavedItems([]);
      setSavedError(err instanceof Error ? err.message : "Failed to load saved items");
      setHasLoadedSaved(true);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [hasLoadedSaved, isLoadingSaved]);

  const loadNotes = useCallback(async () => {
    if (hasLoadedNotes || isLoadingNotes) return;

    setIsLoadingNotes(true);
    setNotesError(null);

    try {
      const res = await fetch("/api/notes");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to load notes");
      }

      setNotes(data.notes ?? []);
      setHasLoadedNotes(true);
    } catch (err) {
      setNotes([]);
      setNotesError(err instanceof Error ? err.message : "Failed to load notes");
      setHasLoadedNotes(true);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [hasLoadedNotes, isLoadingNotes]);

  async function saveItem(item: SearchResult) {
    if (savedUrls.has(item.url)) return;

    const res = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json();

    if (!res.ok) {
      setSavedError(data.error?.message ?? "Failed to save item");
      return;
    }

    setSavedItems((prev) => {
      const withoutDuplicate = prev.filter((saved) => saved.url !== data.item.url);
      return [data.item, ...withoutDuplicate];
    });
    setHasLoadedSaved(true);
  }

  async function removeItem(id: string) {
    const res = await fetch(`/api/saved/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setSavedError(data.error?.message ?? "Failed to remove item");
      return;
    }

    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function createNote(note: { title: string; content: string }) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    const data = await res.json();

    if (!res.ok) {
      setNotesError(data.error?.message ?? "Failed to create note");
      return;
    }

    setNotes((prev) => [data.note, ...prev]);
    setHasLoadedNotes(true);
  }

  async function updateNote(id: string, note: { title: string; content: string }) {
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    const data = await res.json();

    if (!res.ok) {
      setNotesError(data.error?.message ?? "Failed to update note");
      return;
    }

    setNotes((prev) => prev.map((existing) => (existing.id === id ? data.note : existing)));
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setNotesError(data.error?.message ?? "Failed to delete note");
      return;
    }

    setNotes((prev) => prev.filter((note) => note.id !== id));
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Search failed");
      }

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

    if (module === "saved") {
      loadSavedItems();
    }

    if (module === "notes") {
      loadNotes();
    }
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Search results
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {searchData.results.length} result{searchData.results.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => selectModule(activeModule)}
                  className="text-xs font-medium text-primary hover:text-primary-hover"
                >
                  Clear search
                </button>
              </div>

              {searchData.summary && (
                <div className="rounded-md border border-muted bg-muted p-4 dark:border-primary-hover dark:bg-primary-hover/20">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
                    AI Summary
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {searchData.summary}
                  </p>
                  {searchData.rewrittenQuery && searchData.rewrittenQuery !== query.trim() && (
                    <p className="mt-2 text-xs italic text-zinc-400 dark:text-zinc-500">
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
                      className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-secondary hover:bg-zinc-50 hover:text-primary dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-primary dark:hover:text-secondary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {searchData.results.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No results found.</p>
              ) : (
                <ul className="space-y-4">
                  {searchData.results.map((result) => {
                    const alreadySaved = savedUrls.has(result.url);

                    return (
                      <li
                        key={result.url}
                        className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-medium text-zinc-900 hover:text-primary dark:text-zinc-100 dark:hover:text-secondary"
                          >
                            {result.title}
                          </a>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                              {result.score}
                            </span>
                            <button
                              type="button"
                              onClick={() => saveItem(result)}
                              disabled={alreadySaved}
                              className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-default disabled:border-zinc-200 disabled:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              {alreadySaved ? "Saved" : "Save"}
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {result.description}
                        </p>
                        <p className="mt-1 truncate text-xs text-zinc-400 dark:text-zinc-500">
                          {result.url}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {!isSearching && !searchData && !searchError && activeModule === "news" && (
            <NewsBriefingModule />
          )}

          {!isSearching && !searchData && !searchError && activeModule === "notes" && (
            <NotesModule
              notes={notes}
              isLoading={isLoadingNotes}
              error={notesError}
              onCreate={createNote}
              onUpdate={updateNote}
              onDelete={deleteNote}
            />
          )}

          {!isSearching && !searchData && !searchError && activeModule === "saved" && (
            <SavedModule
              items={savedItems}
              isLoading={isLoadingSaved}
              error={savedError}
              onRemove={removeItem}
            />
          )}
        </main>

        <aside className="order-1 lg:order-2 lg:border-l lg:border-zinc-200 lg:pl-6 dark:lg:border-zinc-700">
          <div className="w-full rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Modules
              </p>
              {(searchData || searchError) && (
                <button
                  type="button"
                  onClick={() => selectModule(activeModule)}
                  className="text-xs font-medium text-primary hover:text-primary-hover"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex w-full gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {dashboardModules.map((module) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id && !searchData && !searchError;

                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => selectModule(module.id)}
                    className={
                      "group flex w-full min-w-[180px] items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors lg:min-w-0 " +
                      (isActive
                        ? "border-primary bg-primary-hover text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-primary hover:bg-muted/40 hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")
                    }
                  >
                    <span
                      className={
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border " +
                        (isActive
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-zinc-200 bg-zinc-50 text-primary group-hover:border-primary dark:border-zinc-700 dark:bg-zinc-800")
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{module.title}</span>
                      <span className="mt-0.5 block truncate text-xs opacity-75">
                        {module.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
