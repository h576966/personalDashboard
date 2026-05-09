"use client";

interface ReadLaterItem {
  id: string;
  title: string;
  url: string;
  description: string;
  score?: number;
  status: "unread" | "read" | "archived";
}

interface ReadLaterModuleProps {
  items: ReadLaterItem[];
  isLoading: boolean;
  error?: string | null;
  onMarkRead: (id: string, status: "unread" | "read") => void | Promise<void>;
  onArchive: (id: string) => void | Promise<void>;
}

export default function ReadLaterModule({
  items,
  isLoading,
  error,
  onMarkRead,
  onArchive,
}: ReadLaterModuleProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Read Later</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Search results saved for later reading.
        </p>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nothing saved yet. Save useful search results to build a reading queue.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-zinc-900 hover:text-primary dark:text-zinc-100 dark:hover:text-secondary"
                  >
                    {item.title}
                  </a>
                  <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium capitalize text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {item.description}
                </p>
                <p className="mt-1 truncate text-xs text-zinc-400 dark:text-zinc-500">
                  {item.url}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onMarkRead(item.id, item.status === "read" ? "unread" : "read")}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-primary hover:text-primary dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {item.status === "read" ? "Mark unread" : "Mark read"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onArchive(item.id)}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-red-500 hover:text-red-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Archive
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
