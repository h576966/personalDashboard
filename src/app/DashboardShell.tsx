"use client";

import { BookMarked, ListChecks, Newspaper, NotebookPen } from "lucide-react";
import ListsModule from "./ListsModule";
import NewsBriefingModule from "./NewsBriefingModule";
import NotesModule from "./NotesModule";
import ReadLaterModule from "./ReadLaterModule";
import SearchModule from "./SearchModule";
import { dashboardModules, type ActiveModule } from "./modules";
import { useDashboardData } from "./useDashboardData";

interface DashboardShellProps {
  userEmail: string;
}

export default function DashboardShell({ userEmail }: DashboardShellProps) {
  const {
    activeModule,
    query,
    freshness,
    country,
    isSearching,
    searchData,
    searchError,
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
    storyCount,
    setQuery,
    setFreshness,
    setCountry,
    setOpenListCount,
    setStoryCount,
    saveItem,
    updateSavedStatus,
    createNote,
    updateNote,
    deleteNote,
    handleSearch,
    handleSuggestionClick,
    selectModule,
    signOut,
  } = useDashboardData();

  return (
    <div className="min-h-screen">
      {notice && (
        <div className="fixed right-4 top-4 z-50 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {notice}
        </div>
      )}

      <div className="border-b border-zinc-200 bg-white px-6 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-200">Home</span>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate">{userEmail}</span>
            <button
              type="button"
              onClick={signOut}
              className="font-medium text-primary hover:text-primary-hover"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

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

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(260px,2.6fr)]">
        <main className="order-2 min-w-0 lg:order-1">
          {!isSearching && !searchData && !searchError && (
            <MetricRow
              stories={storyCount}
              openItems={openListCount}
              unreadItems={hasLoadedSaved ? unreadSavedCount : null}
              notes={notesCount}
            />
          )}

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
                              {alreadySaved ? "Read later" : "Save"}
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

          {!isSearching && !searchData && !searchError && activeModule === "lists" && (
            <ListsModule onOpenCountChange={setOpenListCount} />
          )}

          {!isSearching && !searchData && !searchError && activeModule === "news" && (
            <NewsBriefingModule
              savedUrls={savedUrls}
              onStoryCountChange={setStoryCount}
              onSaveSource={(item) => saveItem({ ...item, source: "news" })}
            />
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

          {!isSearching && !searchData && !searchError && activeModule === "readLater" && (
            <ReadLaterModule
              items={savedItems}
              isLoading={isLoadingSaved}
              error={savedError}
              onMarkRead={(id, status) => updateSavedStatus(id, status)}
              onArchive={(id) => updateSavedStatus(id, "archived")}
              onRestore={(id) => updateSavedStatus(id, "unread")}
            />
          )}
        </main>

        <aside className="order-1 lg:order-2">
          <div className="w-full rounded-md border border-zinc-200 bg-white/80 p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Sections
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
                        ? "border-primary bg-primary-hover text-white shadow-sm"
                        : "border-zinc-200 bg-white/70 text-zinc-700 hover:border-primary hover:bg-muted/40 hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{module.title}</span>
                      <span className="mt-0.5 block truncate text-xs opacity-75">
                        {module.description}
                      </span>
                    </span>
                    <ModuleCount value={moduleCount(module.id, {
                      openListCount,
                      notesCount,
                      storyCount,
                      unreadSavedCount: hasLoadedSaved ? unreadSavedCount : null,
                    })} active={isActive} />
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

function MetricRow({
  stories,
  openItems,
  unreadItems,
  notes,
}: {
  stories: number | null;
  openItems: number | null;
  unreadItems: number | null;
  notes: number | null;
}) {
  const metrics = [
    { label: "Stories", value: stories, icon: Newspaper },
    { label: "Open", value: openItems, icon: ListChecks },
    { label: "Unread", value: unreadItems, icon: BookMarked },
    { label: "Notes", value: notes, icon: NotebookPen },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <span className="flex min-w-0 items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-xs font-medium">{label}</span>
          </span>
          <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {value ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function ModuleCount({ value, active }: { value: number | null; active: boolean }) {
  if (value === null) return null;

  return (
    <span
      className={
        "shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums " +
        (active
          ? "bg-white/15 text-white"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300")
      }
    >
      {value}
    </span>
  );
}

function moduleCount(
  module: ActiveModule,
  counts: {
    openListCount: number | null;
    notesCount: number | null;
    storyCount: number | null;
    unreadSavedCount: number | null;
  },
): number | null {
  if (module === "lists") return counts.openListCount;
  if (module === "notes") return counts.notesCount;
  if (module === "news") return counts.storyCount;
  return counts.unreadSavedCount;
}
