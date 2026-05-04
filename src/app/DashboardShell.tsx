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
          {!isSearching && !searchData && !searchError && activeModule === "news" && (
            <NewsBriefingModule />
          )}

          {/* keep rest unchanged */}
        </main>
      </div>
    </div>
  );
}
