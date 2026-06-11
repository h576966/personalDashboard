"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAppCopy, normalizeAppLanguage, type AppLanguage } from "@/lib/i18n";
import { searchNotes, type NoteSearchResult } from "@/lib/search/notes";
import { normalizeParam } from "@/lib/utils";
import type { ActiveModule } from "./modules";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  score: number;
  source?: string;
}

export interface SavedItem extends SearchResult {
  id: string;
  source?: string;
  status: "unread" | "read" | "archived";
  created_at?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchData {
  mode: SearchMode;
  query: string;
  results: SearchResult[];
  noteResults?: NoteSearchResult[];
  summary?: string;
  suggestions?: string[];
  rewrittenQuery?: string;
  stale?: boolean;
}

export type SearchMode = "web" | "notes";

export function useDashboardData() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("lists");
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("en");

  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("web");
  const [freshness, setFreshness] = useState("");
  const [country, setCountry] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSearchSummary, setIsLoadingSearchSummary] = useState(false);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSummaryError, setSearchSummaryError] = useState<string | null>(null);
  const searchRequestId = useRef(0);

  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [hasLoadedNotes, setHasLoadedNotes] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [openListCount, setOpenListCount] = useState<number | null>(null);
  const copy = useMemo(() => getAppCopy(appLanguage), [appLanguage]);

  const savedUrls = useMemo(
    () => new Set(savedItems.filter((item) => item.status !== "archived").map((item) => item.url)),
    [savedItems],
  );
  const unreadSavedCount = useMemo(
    () => savedItems.filter((item) => item.status === "unread").length,
    [savedItems],
  );
  const notesCount = hasLoadedNotes ? notes.length : null;

  const loadPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/app-preferences");
      const data = await res.json();

      if (!res.ok) return;

      setAppLanguage(normalizeAppLanguage(data.app_language));
    } catch {
      setAppLanguage("en");
    }
  }, []);

  const loadListOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();

      if (!res.ok) return;

      const lists = Array.isArray(data.lists) ? data.lists : [];
      const count = lists.reduce((total: number, list: { items?: Array<{ is_completed?: boolean }> }) => {
        const items = Array.isArray(list.items) ? list.items : [];
        return total + items.filter((item) => !item.is_completed).length;
      }, 0);

      setOpenListCount(count);
    } catch {
      setOpenListCount(null);
    }
  }, []);

  const loadSavedItems = useCallback(async (force = false) => {
    if (!force && (hasLoadedSaved || isLoadingSaved)) return;

    setIsLoadingSaved(true);
    setSavedError(null);

    try {
      const res = await fetch("/api/saved?status=all");
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadListOverview();
      void loadPreferences();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadListOverview, loadPreferences]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2400);
  }

  async function updateSavedStatus(id: string, status: SavedItem["status"]) {
    const res = await fetch(`/api/saved/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSavedError(data.error?.message ?? "Failed to update saved item");
      return;
    }

    setSavedItems((prev) => prev.map((item) => (item.id === id ? data.item : item)));
  }

  async function saveItem(item: SearchResult): Promise<boolean> {
    const existing = savedItems.find((saved) => saved.url === item.url);

    if (existing?.status === "archived") {
      await updateSavedStatus(existing.id, "unread");
      showNotice(copy.notices.restored);
      return true;
    }

    if (existing || savedUrls.has(item.url)) {
      showNotice(copy.notices.alreadySaved);
      return true;
    }

    const res = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json();

    if (!res.ok) {
      setSavedError(data.error?.message ?? "Failed to save item");
      return false;
    }

    setSavedItems((prev) => {
      const withoutDuplicate = prev.filter((saved) => saved.url !== data.item.url);
      return [data.item, ...withoutDuplicate];
    });
    setHasLoadedSaved(true);
    showNotice(copy.notices.saved);
    return true;
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

  async function fetchNotesForSearch(): Promise<Note[]> {
    if (hasLoadedNotes) return notes;

    setIsLoadingNotes(true);
    setNotesError(null);

    try {
      const res = await fetch("/api/notes");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to load notes");
      }

      const loadedNotes = data.notes ?? [];
      setNotes(loadedNotes);
      setHasLoadedNotes(true);
      return loadedNotes;
    } catch (err) {
      setNotes([]);
      setNotesError(err instanceof Error ? err.message : "Failed to load notes");
      setHasLoadedNotes(true);
      return [];
    } finally {
      setIsLoadingNotes(false);
    }
  }

  async function loadSearchSummary(
    requestId: number,
    searchQuery: string,
    results: SearchResult[],
    rewrittenQuery?: string,
  ) {
    if (results.length === 0) return;

    setIsLoadingSearchSummary(true);
    setSearchSummaryError(null);

    try {
      const res = await fetch("/api/search/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: rewrittenQuery ?? searchQuery,
          results: results.slice(0, 5).map((result) => ({
            title: result.title,
            description: result.description,
            url: result.url,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Summary failed");
      }

      if (searchRequestId.current !== requestId) return;

      setSearchData((current) => {
        if (!current || current.mode !== "web" || current.query !== searchQuery) return current;
        return {
          ...current,
          summary: data.summary,
          suggestions: data.suggestions,
        };
      });
    } catch (err) {
      if (searchRequestId.current === requestId) {
        setSearchSummaryError(err instanceof Error ? err.message : "Summary failed");
      }
    } finally {
      if (searchRequestId.current === requestId) {
        setIsLoadingSearchSummary(false);
      }
    }
  }

  async function handleSearch(searchQuery: string, modeOverride: SearchMode = searchMode) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    setIsSearching(true);
    setIsLoadingSearchSummary(false);
    setSearchData(null);
    setSearchError(null);
    setSearchSummaryError(null);

    if (modeOverride === "notes") {
      try {
        const sourceNotes = await fetchNotesForSearch();
        const noteResults = searchNotes(sourceNotes, trimmed);

        if (searchRequestId.current === requestId) {
          setSearchData({
            mode: "notes",
            query: trimmed,
            results: [],
            noteResults,
          });
        }
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (searchRequestId.current === requestId) {
          setIsSearching(false);
        }
      }
      return;
    }

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

      if (searchRequestId.current === requestId) {
        const nextSearchData: SearchData = {
          mode: "web",
          query: trimmed,
          results: data.results ?? [],
          rewrittenQuery: data.rewrittenQuery,
          stale: data.stale === true,
        };
        setSearchData(nextSearchData);
        void loadSavedItems();
        void loadSearchSummary(
          requestId,
          trimmed,
          nextSearchData.results,
          nextSearchData.rewrittenQuery,
        );
      }
    } catch (err) {
      if (searchRequestId.current === requestId) {
        setSearchError(err instanceof Error ? err.message : "Search failed");
      }
    } finally {
      if (searchRequestId.current === requestId) {
        setIsSearching(false);
      }
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    setSearchMode("web");
    void handleSearch(suggestion, "web");
  }

  function changeSearchMode(mode: SearchMode) {
    setSearchMode(mode);
    setSearchData(null);
    setSearchError(null);
    setSearchSummaryError(null);
    setIsLoadingSearchSummary(false);
  }

  function selectModule(module: ActiveModule) {
    searchRequestId.current += 1;
    setActiveModule(module);
    setSearchData(null);
    setSearchError(null);
    setSearchSummaryError(null);
    setIsLoadingSearchSummary(false);

    if (module === "readLater") {
      void loadSavedItems();
    }

    if (module === "notes") {
      void loadNotes();
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return {
    activeModule,
    appLanguage,
    copy,
    query,
    searchMode,
    freshness,
    country,
    isSearching,
    isLoadingSearchSummary,
    searchData,
    searchError,
    searchSummaryError,
    savedItems,
    isLoadingSaved,
    savedError,
    hasLoadedSaved,
    savedUrls,
    unreadSavedCount,
    notes,
    isLoadingNotes,
    notesError,
    notesCount,
    notice,
    openListCount,
    setQuery,
    setSearchMode: changeSearchMode,
    setFreshness,
    setCountry,
    setOpenListCount,
    loadPreferences,
    saveItem,
    updateSavedStatus,
    createNote,
    updateNote,
    deleteNote,
    handleSearch,
    handleSuggestionClick,
    selectModule,
    signOut,
  };
}
