"use client";

import { useMemo, useState } from "react";
import { Archive, CheckCircle2, Circle, ExternalLink, RotateCcw } from "lucide-react";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  LoadingRow,
  ModuleCard,
  ModuleHeader,
  SegmentedControl,
} from "./components/ModuleChrome";

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
}

type ReadLaterTab = "unread" | "read" | "archived";

function sourceLabel(item: ReadLaterItem): string {
  if (item.source && item.source !== "search" && item.source !== "news") return item.source;

  try {
    return new URL(item.url).hostname.replace(/^www\./, "");
  } catch {
    return item.source ?? "Saved";
  }
}

function savedDate(value?: string): string {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function ReadLaterModule({
  items,
  isLoading,
  error,
  onMarkRead,
  onArchive,
  onRestore,
}: ReadLaterModuleProps) {
  const [tab, setTab] = useState<ReadLaterTab>("unread");
  const unreadItems = useMemo(() => items.filter((item) => item.status === "unread"), [items]);
  const readItems = useMemo(() => items.filter((item) => item.status === "read"), [items]);
  const archivedItems = useMemo(() => items.filter((item) => item.status === "archived"), [items]);
  const visibleItems =
    tab === "unread" ? unreadItems : tab === "read" ? readItems : archivedItems;
  const emptyCopy = {
    unread: {
      title: "No unread items.",
      description: "Save useful search results or news sources and they will wait here.",
    },
    read: {
      title: "Nothing marked read yet.",
      description: "Mark items as read when they are done but still worth keeping nearby.",
    },
    archived: {
      title: "Nothing archived.",
      description: "Archived items stay recoverable here without cluttering the main queue.",
    },
  } satisfies Record<ReadLaterTab, { title: string; description: string }>;

  return (
    <ModuleCard>
      <ModuleHeader
        title="Read Later"
        description="A small queue for articles and search results worth coming back to."
        action={
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "unread", label: "Unread", count: unreadItems.length },
              { value: "read", label: "Read", count: readItems.length },
              { value: "archived", label: "Archived", count: archivedItems.length },
            ]}
          />
        }
      />

      <div className="p-4">
        {error && <InlineNotice tone="error" className="mb-4">{error}</InlineNotice>}

        {isLoading ? (
          <LoadingRow label="Loading saved items..." />
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title={emptyCopy[tab].title}
            description={emptyCopy[tab].description}
          />
        ) : (
          <ul className="space-y-3">
            {visibleItems.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 text-base font-medium leading-snug text-zinc-900 hover:text-primary dark:text-zinc-100 dark:hover:text-secondary"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    </a>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
                      <span>{sourceLabel(item)}</span>
                      {savedDate(item.created_at) && <span>{savedDate(item.created_at)}</span>}
                      {item.source && item.source !== "search" && (
                        <span className="capitalize">{item.source}</span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium capitalize text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                    {item.status}
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
                      Restore
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
                        {item.status === "read" ? "Mark unread" : "Mark read"}
                      </ActionButton>
                      <ActionButton
                        onClick={() => onArchive(item.id)}
                        variant="danger"
                        className="min-h-8 px-2.5 py-1.5 text-xs"
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </ActionButton>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModuleCard>
  );
}
