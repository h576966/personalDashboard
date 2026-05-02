"use client";

interface BriefingItem {
  id: string;
  title: string;
  url: string;
  description: string;
  source: string;
  score: number;
  topicName: string;
  topicId: string;
  status: string;
  firstSeenAt: string;
}

interface BriefingProps {
  items: BriefingItem[];
  loading: boolean;
  error: string | null;
  onDismiss: (id: string) => void;
  onSave: (id: string) => void;
  onRefresh: () => void;
}

export default function Briefing({
  items,
  loading,
  error,
  onDismiss,
  onSave,
  onRefresh,
}: BriefingProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="inline-block w-4 h-4 border-2 border-zinc-300 border-t-teal-600 rounded-full animate-spin" />
          <span>Loading briefing...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-zinc-500 dark:text-zinc-400">
          No briefing items yet.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md bg-teal-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Fetch morning briefing
        </button>
      </div>
    );
  }

  // Group items by topic
  const grouped = items.reduce<Record<string, BriefingItem[]>>((acc, item) => {
    if (!acc[item.topicName]) acc[item.topicName] = [];
    acc[item.topicName].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {items.length} item{items.length !== 1 ? "s" : ""} in briefing
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {Object.entries(grouped).map(([topicName, topicItems]) => (
        <div key={topicName}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {topicName}
          </h3>
          <ul className="space-y-3">
            {topicItems.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-zinc-900 hover:text-teal-700 dark:text-zinc-100 dark:hover:text-teal-500"
                  >
                    {item.title}
                  </a>
                  <span className="shrink-0 rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                    {item.score}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500 line-clamp-2 dark:text-zinc-400">
                  {item.description}
                </p>
                <p className="mt-1 text-xs text-zinc-400 truncate dark:text-zinc-500">
                  {item.url}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDismiss(item.id)}
                    className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => onSave(item.id)}
                    className="rounded-md border border-teal-300 px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30"
                  >
                    Save
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
