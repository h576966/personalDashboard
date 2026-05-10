"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, InlineNotice, SkeletonList } from "./components/ModuleChrome";
import type { AppCopy, AppLanguage } from "@/lib/i18n";
import StoryCardView from "./newsBriefing/StoryCardView";
import type { BriefingSource, StoryCard } from "./newsBriefing/helpers";

interface BriefingResponse {
  briefing?: {
    storyCards?: StoryCard[];
    generatedAt?: string;
  };
  error?: string | {
    message?: string;
  };
}
interface NewsBriefingModuleProps {
  savedUrls: Set<string>;
  appLanguage: AppLanguage;
  copy: AppCopy;
  onStoryCountChange?: (count: number) => void;
  onSaveSource: (item: {
    title: string;
    url: string;
    description: string;
    score: number;
  }) => Promise<boolean>;
}

export default function NewsBriefingModule({
  savedUrls,
  appLanguage,
  copy,
  onStoryCountChange,
  onSaveSource,
}: NewsBriefingModuleProps) {
  const [storyCards, setStoryCards] = useState<StoryCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [feedbackByStory, setFeedbackByStory] = useState<Record<string, "up" | "down">>({});
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [savingUrls, setSavingUrls] = useState<Set<string>>(new Set());
  const [expandedStoryIds, setExpandedStoryIds] = useState<Set<string>>(new Set());
  const [cacheEmpty, setCacheEmpty] = useState(false);

  const loadBriefings = useCallback(async (refresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/news/briefings", {
        method: refresh ? "POST" : "GET",
      });
      const data = (await res.json()) as BriefingResponse;

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? "Failed to load news briefing",
        );
      }

      if (data.briefing === null) {
        setStoryCards([]);
        setCacheEmpty(true);
      } else {
        setStoryCards(data.briefing?.storyCards ?? []);
        setCacheEmpty(false);
      }
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
      const data = (await res.json()) as BriefingResponse;

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? "Failed to save feedback",
        );
      }
    } catch (err) {
      setFeedbackNotice(
        err instanceof Error ? err.message : "Feedback noted here, but could not sync yet.",
      );
    }
  }

  async function saveSource(story: StoryCard, source: BriefingSource) {
    setSavingUrls((prev) => new Set(prev).add(source.url));
    await onSaveSource({
      title: source.title || story.title,
      url: source.url,
      description: source.description || story.summary,
      score: Math.round(story.score),
    });
    setSavingUrls((prev) => {
      const next = new Set(prev);
      next.delete(source.url);
      return next;
    });
  }

  function toggleStoryDetails(storyId: string) {
    setExpandedStoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId);
      else next.add(storyId);
      return next;
    });
  }

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      const timer = window.setTimeout(() => {
        void loadBriefings();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [hasLoaded, isLoading, loadBriefings]);

  useEffect(() => {
    if (hasLoaded) onStoryCountChange?.(storyCards.length);
  }, [hasLoaded, onStoryCountChange, storyCards.length]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
            {copy.news.eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {copy.news.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {copy.news.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => loadBriefings(true)}
            disabled={isLoading}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {isLoading ? copy.news.refreshing : copy.news.refresh}
          </button>
        </div>
      </div>

      {error && <InlineNotice tone="error">{error}</InlineNotice>}
      {feedbackNotice && <InlineNotice tone="warning">{feedbackNotice}</InlineNotice>}
      {isLoading && storyCards.length === 0 && <SkeletonList count={3} />}

      {!isLoading && !error && hasLoaded && storyCards.length === 0 && cacheEmpty && (
        <EmptyState title={copy.news.noCacheTitle} description={copy.news.noCacheDescription} />
      )}

      {!isLoading && !error && hasLoaded && storyCards.length === 0 && !cacheEmpty && (
        <EmptyState title={copy.news.noStoriesTitle} description={copy.news.noStoriesDescription} />
      )}

      <div className="space-y-5">
        {storyCards.map((story, index) => (
          <StoryCardView
            key={story.id}
            story={story}
            index={index}
            appLanguage={appLanguage}
            copy={copy}
            isExpanded={expandedStoryIds.has(story.id)}
            currentFeedback={feedbackByStory[story.id]}
            savedUrls={savedUrls}
            savingUrls={savingUrls}
            onToggleDetails={toggleStoryDetails}
            onSaveSource={saveSource}
            onFeedback={sendFeedback}
          />
        ))}
      </div>
    </section>
  );
}
