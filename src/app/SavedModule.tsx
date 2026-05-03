"use client";

interface SavedItem {
  id: string;
  title: string;
  url: string;
  description: string;
  score?: number;
}

interface SavedModuleProps {
  items: SavedItem[];
  isLoading: boolean;
  error?: string | null;
  onRemove: (id: string) => void | Promise<void>;
}

export default function SavedModule({ items, isLoading, error, onRemove }: SavedModuleProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Saved</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Links saved from search results.
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
            No saved items yet. Save results from search to keep them here.
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
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="shrink-0 text-xs font-medium text-zinc-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {item.description}
                </p>
                <p className="mt-1 truncate text-xs text-zinc-400 dark:text-zinc-500">
                  {item.url}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
