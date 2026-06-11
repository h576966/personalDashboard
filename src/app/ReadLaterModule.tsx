"use client";

import { useMemo, useState } from "react";
import { Archive, CheckCircle2, Circle, ExternalLink, RotateCcw } from "lucide-react";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  ModuleCard,
  ModuleHeader,
  ResultCount,
  SegmentedControl,
  ShowMoreButton,
  SkeletonList,
  ToolbarInput,
} from "./components/ModuleChrome";
import { formatShortDate, type AppCopy, type AppLanguage } from "@/lib/i18n";

interface ReadLaterItem {
  id: string;
  title: string;
  url: string;
  description: string;
  score?: number;
  source?: string;
  created_at?: string;
  status: "unread" | "read" | "archived";
}

interface ReadLaterModuleProps {
  items: ReadLaterItem[];
  isLoading: boolean;
  error?: string | null;
  onMarkRead: (id: string, status: "unread" | "read") => void | Promise<void>;
  onArchive: (id: string) => void | Promise<void>;
  onRestore: (id: string) => void | Promise<void>;
  appLanguage: AppLanguage;
  copy: AppCopy;
}

type ReadLaterTab = "unread" | "read" | "archived";

const PAGE_SIZE = 8;

function sourceLabel(item: ReadLaterItem): string {
  if (item.source && item.source !== "search") return item.source;

  try {
    return new URL(item.url).hostname.replace(/^www\./, "");
  } catch {
    return item.source ?? "Saved";
  }
}

function searchableText(item: ReadLaterItem): string {
  return `${item.title} ${item.description} ${item.url} ${sourceLabel(item)} ${item.source ?? ""}`.toLowerCase();
}

function statusLabel(status: ReadLaterItem["status"], copy: AppCopy): string {
  if (status === "read") return copy.readLater.read;
  if (status === "archived") return copy.readLater.archived;
  return copy.readLater.unread;
}

export default function ReadLaterModule({
  items,
  isLoading,
  error,
  onMarkRead,
  onArchive,
  onRestore,
  appLanguage,
  copy,
}: ReadLaterModuleProps) {
  const [tab, setTab] = useState<ReadLaterTab>("unread");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const unreadItems = useMemo(() => items.filter((item) => item.status === "unread"), [items]);
  const readItems = useMemo(() => items.filter((item) => item.status === "read"), [items]);
  const archivedItems = useMemo(() => items.filter((item) => item.status === "archived"), [items]);
  const tabItems = tab === "unread" ? unreadItems : tab === "read" ? readItems : archivedItems;
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tabItems;

    return tabItems.filter((item) => searchableText(item).includes(query));
  }, [searchQuery, tabItems]);
  const visibleItems = filteredItems.slice(0, visibleCount);
  const hiddenCount = Math.max(filteredItems.length - visibleItems.length, 0);
  const emptyCopy = {
    unread: {
      title: copy.readLater.noUnreadTitle,
      description: copy.readLater.noUnreadDescription,
    },
    read: {
      title: copy.readLater.noReadTitle,
      description: copy.readLater.noReadDescription,
    },
    archived: {
      title: copy.readLater.noArchivedTitle,
      description: copy.readLater.noArchivedDescription,
    },
  } satisfies Record<ReadLaterTab, { title: string; description: string }>;

  return (
    <ModuleCard>
      <ModuleHeader
        title={copy.readLater.title}
        description={copy.readLater.description}
        action={
          <SegmentedControl
            value={tab}
            onChange={(value) => {
              setTab(value);
              setVisibleCount(PAGE_SIZE);
            }}
            options={[
              { value: "unread", label: copy.readLater.unread, count: unreadItems.length },
              { value: "read", label: copy.readLater.read, count: readItems.length },
              { value: "archived", label: copy.readLater.archived, count: archivedItems.length },
            ]}
          />
        }
      />

      <div className="space-y-4 p-4">
        {error && <InlineNotice tone="error">{error}</InlineNotice>}

        {isLoading ? (
          <SkeletonList count={3} />
        ) : tabItems.length === 0 ? (
          <EmptyState
            title={emptyCopy[tab].title}
            description={emptyCopy[tab].description}
          />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <ToolbarInput
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder={copy.readLater.search}
              />
              <ResultCount>
                {searchQuery.trim()
                  ? copy.counts.match(filteredItems.length)
                  : copy.counts.item(tabItems.length)}
              </ResultCount>
            </div>

            {filteredItems.length === 0 ? (
              <EmptyState
                title={copy.readLater.noMatchesTitle}
                description={copy.readLater.noMatchesDescription}
              />
            ) : (
              <>
                <ul className="space-y-2 sm:space-y-3">
                  {visibleItems.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-start gap-1.5 text-sm font-semibold leading-snug text-zinc-900 hover:text-primary dark:text-zinc-100 dark:hover:text-secondary sm:text-base"
                          >
                            <span>{item.title}</span>
                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          </a>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
                            <span>{sourceLabel(item)}</span>
                            {formatShortDate(item.created_at, appLanguage) && (
                              <span>{formatShortDate(item.created_at, appLanguage)}</span>
                            )}
                            {item.source && item.source !== "search" && (
                              <span className="capitalize">{item.source}</span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium capitalize text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                          {statusLabel(item.status, copy)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.status === "archived" ? (
                          <ActionButton
                            onClick={() => onRestore(item.id)}
                            variant="secondary"
                            className="min-h-8 px-2.5 py-1.5 text-xs"
                          >
                            <RotateCcw className="h-4 w-4" />
                            {copy.readLater.restore}
                          </ActionButton>
                        ) : (
                          <>
                            <ActionButton
                              onClick={() =>
                                onMarkRead(item.id, item.status === "read" ? "unread" : "read")
                              }
                              variant="secondary"
                              className="min-h-8 px-2.5 py-1.5 text-xs"
                            >
                              {item.status === "read" ? (
                                <Circle className="h-4 w-4" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              {item.status === "read" ? copy.readLater.markUnread : copy.readLater.markRead}
                            </ActionButton>
                            <ActionButton
                              onClick={() => onArchive(item.id)}
                              variant="danger"
                              className="min-h-8 px-2.5 py-1.5 text-xs"
                            >
                              <Archive className="h-4 w-4" />
                              {copy.readLater.archive}
                            </ActionButton>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <ShowMoreButton
                  hiddenCount={hiddenCount}
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  label={copy.showMore(hiddenCount)}
                />
              </>
            )}
          </>
        )}
      </div>
    </ModuleCard>
  );
}
