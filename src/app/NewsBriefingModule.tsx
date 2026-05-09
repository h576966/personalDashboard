"use client";

import { useCallback, useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import BriefingPreferencesPanel from "./BriefingPreferencesPanel";
import TopicsPanel from "./TopicsPanel";

interface BriefingSource {
  title: string;
  url: string;
  source?: string;
  description?: string;
}

interface StoryCard {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  score: number;
  sources: BriefingSource[];
  angles: string[];
  matchedInterests: string[];
  isWatchUpdate: boolean;
  generatedAt: string;
}

interface BriefingResponse {
  briefing?: {
    storyCards?: StoryCard[];
    generatedAt?: string;
  };
  error?: {
    message?: string;
  };
}

function sourceLabel(source: BriefingSource): string {
  try {
    return source.source || new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return source.source || source.url;
  }
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
  const [storyCards, setStoryCards] = useState<StoryCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [feedbackByStory, setFeedbackByStory] = useState<Record<string, "up" | "down">>({});
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const loadBriefings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/news/briefings");
      const data = (await res.json()) as BriefingResponse;

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to load news briefing");
      }

      setStoryCards(data.briefing?.storyCards ?? []);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news briefing");
      setStoryCards([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function sendFeedback(storyId: string, vote: "up" | "down") {
    setFeedbackNotice(null);
    setFeedbackByStory((prev) => ({ ...prev, [storyId]: vote }));

    try {
      const res = await fetch("/api/news/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, vote }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to save feedback");
    } catch (err) {
      setFeedbackNotice(
        err instanceof Error
          ? err.message
          : "Feedback noted here, but could not sync yet.",
      );
    }
  }

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      const timer = window.setTimeout(() => {
        void loadBriefings();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [hasLoaded, isLoading, loadBriefings]);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
            Today&apos;s briefing
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Top 5 daily stories
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            High-signal updates from trusted sources, ranked before AI summarizes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreferences((prev) => !prev)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Preferences
          </button>

          <button
            type="button"
            onClick={loadBriefings}
            disabled={isLoading}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {showPreferences && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <BriefingPreferencesPanel
            onClose={() => setShowPreferences(false)}
            onSaved={() => {
              void loadBriefings();
            }}
          />
          <TopicsPanel />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {feedbackNotice && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          {feedbackNotice}
        </div>
      )}

      {isLoading && storyCards.length === 0 && (
        <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          Building today&apos;s top stories...
        </div>
      )}

      {!isLoading && !error && hasLoaded && storyCards.length === 0 && (
        <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          No high-signal stories could be generated from the current sources and interests.
        </div>
      )}

      <div className="space-y-5">
        {storyCards.map((story, index) => (
          <article
            key={story.id}
            className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-secondary">
                  {story.isWatchUpdate ? "Watch update" : `Story ${index + 1}`}
                </p>
                <h2 className="mt-1 text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                  {story.title}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                  {story.score}
                </span>
                {story.generatedAt && (
                  <span className="text-xs text-zinc-400">
                    {formatTime(story.generatedAt)}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {story.summary}
            </p>

            {story.whyItMatters && (
              <div className="mt-4 rounded-md border border-muted bg-muted/60 p-3 dark:border-primary-hover dark:bg-primary-hover/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
                  Why it matters
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {story.whyItMatters}
                </p>
              </div>
            )}

            {story.matchedInterests.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {story.matchedInterests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {story.angles.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Source angles
                </p>
                <ul className="mt-2 space-y-1.5">
                  {story.angles.map((angle) => (
                    <li key={angle} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {angle}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-700">
              {story.sources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {story.sources.map((source) => (
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

              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => sendFeedback(story.id, "up")}
                  aria-label="Thumbs up"
                  className={
                    "rounded-md border p-1.5 transition-colors " +
                    (feedbackByStory[story.id] === "up"
                      ? "border-primary bg-muted text-primary"
                      : "border-zinc-300 text-zinc-500 hover:border-primary hover:text-primary dark:border-zinc-600")
                  }
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => sendFeedback(story.id, "down")}
                  aria-label="Thumbs down"
                  className={
                    "rounded-md border p-1.5 transition-colors " +
                    (feedbackByStory[story.id] === "down"
                      ? "border-primary bg-muted text-primary"
                      : "border-zinc-300 text-zinc-500 hover:border-primary hover:text-primary dark:border-zinc-600")
                  }
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
