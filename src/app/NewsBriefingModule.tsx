"use client";

import { useState } from "react";

interface BriefingSource {
  title: string;
  url: string;
  source?: string;
  description?: string;
}

interface BriefingStory {
  title: string;
  summary: string;
  sourceUrls: string[];
}

interface NewsBriefing {
  topicId: string;
  topicName: string;
  title: string;
  summary: string;
  whyItMatters: string;
  angles: string[];
  stories: BriefingStory[];
  imageUrl?: string | null;
  sources: BriefingSource[];
  generatedAt: string;
}

interface BriefingResponse {
  briefings?: NewsBriefing[];
  error?: {
    message?: string;
  };
}

function sourceLabel(source: BriefingSource): string {
  return source.source || new URL(source.url).hostname.replace(/^www\./, "");
}

function formatTime(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function NewsBriefingModule() {
  const [briefings, setBriefings] = useState<NewsBriefing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  async function loadBriefings() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/news/briefings");
      const data = (await res.json()) as BriefingResponse;

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to load news briefing");
      }

      setBriefings(data.briefings ?? []);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news briefing");
      setBriefings([]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!hasLoaded && !isLoading) {
    void loadBriefings();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
            Today&apos;s briefing
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            AI news briefing
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Concise summaries from multiple sources, grouped by topic.
          </p>
        </div>

        <button
          type="button"
          onClick={loadBriefings}
          disabled={isLoading}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading && briefings.length === 0 && (
        <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          Generating briefing...
        </div>
      )}

      {!isLoading && !error && hasLoaded && briefings.length === 0 && (
        <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          No briefing could be generated from the current topics.
        </div>
      )}

      <div className="space-y-5">
        {briefings.map((briefing) => (
          <article
            key={briefing.topicId}
            className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-secondary">
                  {briefing.topicName}
                </p>
                <h2 className="mt-1 text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                  {briefing.title}
                </h2>
              </div>
              {briefing.generatedAt && (
                <span className="shrink-0 text-xs text-zinc-400">
                  {formatTime(briefing.generatedAt)}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {briefing.summary}
            </p>

            {briefing.whyItMatters && (
              <div className="mt-4 rounded-md border border-muted bg-muted/60 p-3 dark:border-primary-hover dark:bg-primary-hover/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
                  Why it matters
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {briefing.whyItMatters}
                </p>
              </div>
            )}

            {briefing.stories.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Key stories
                </p>
                {briefing.stories.map((story) => (
                  <div key={story.title} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {story.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {story.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {briefing.angles.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Source angles
                </p>
                <ul className="mt-2 space-y-1.5">
                  {briefing.angles.map((angle) => (
                    <li key={angle} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {angle}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {briefing.sources.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-700">
                {briefing.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-primary hover:text-primary dark:border-zinc-600 dark:text-zinc-300"
                  >
                    {sourceLabel(source)}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
