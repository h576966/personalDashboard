"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { BookmarkPlus, Check, ChevronDown, ThumbsDown, ThumbsUp } from "lucide-react";
import BriefingPreferencesPanel from "./BriefingPreferencesPanel";
import TopicsPanel from "./TopicsPanel";
import { ActionButton, EmptyState, InlineNotice, SkeletonList } from "./components/ModuleChrome";
import { formatShortTime, type AppCopy, type AppLanguage } from "@/lib/i18n";

interface BriefingSource {
  title: string;
  url: string;
  source?: string;
  description?: string;
}

interface StoryBreakdownItem {
  title: string;
  summary: string;
  sourceUrls: string[];
}

interface StoryCard {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  score: number;
  sources: BriefingSource[];
  angles: string[];
  storyBreakdown?: StoryBreakdownItem[];
  imageUrl?: string;
  imageSource?: string;
  matchedInterests: string[];
  isWatchUpdate: boolean;
  generatedAt: string;
}

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
  onPreferencesChanged?: () => void | Promise<void>;
}

function sourceLabel(source: BriefingSource): string {
  try {
    return source.source || new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return source.source || source.url;
  }
}

function sourceForUrl(story: StoryCard, url: string): BriefingSource | undefined {
  return story.sources.find((source) => source.url === url);
}

export default function NewsBriefingModule({
  savedUrls,
  appLanguage,
  copy,
  onStoryCountChange,
  onSaveSource,
  onPreferencesChanged,
}: NewsBriefingModuleProps) {
  const [storyCards, setStoryCards] = useState<StoryCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [feedbackByStory, setFeedbackByStory] = useState<Record<string, "up" | "down">>({});
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [savingUrls, setSavingUrls] = useState<Set<string>>(new Set());
  const [expandedStoryIds, setExpandedStoryIds] = useState<Set<string>>(new Set());
  const [cacheEmpty, setCacheEmpty] = useState(false);

  const NON_VISUAL_CATEGORIES = new Set(["Nordic economy and society", "Geopolitics"]);

  function hasVisualInterest(matchedInterests: string[]): boolean {
    return matchedInterests.some((interest) => !NON_VISUAL_CATEGORIES.has(interest));
  }

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
        err instanceof Error
          ? err.message
          : "Feedback noted here, but could not sync yet.",
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
            onClick={() => setShowPreferences((prev) => !prev)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {copy.news.preferences}
          </button>

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

      {showPreferences && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <BriefingPreferencesPanel
            onClose={() => setShowPreferences(false)}
            copy={copy}
            onSaved={async () => {
              await onPreferencesChanged?.();
              void loadBriefings(true);
            }}
          />
          <TopicsPanel copy={copy} />
        </div>
      )}

      {error && <InlineNotice tone="error">{error}</InlineNotice>}

      {feedbackNotice && <InlineNotice tone="warning">{feedbackNotice}</InlineNotice>}

      {isLoading && storyCards.length === 0 && <SkeletonList count={3} />}

      {!isLoading && !error && hasLoaded && storyCards.length === 0 && cacheEmpty && (
        <EmptyState
          title={copy.news.noCacheTitle}
          description={copy.news.noCacheDescription}
        />
      )}

      {!isLoading && !error && hasLoaded && storyCards.length === 0 && !cacheEmpty && (
        <EmptyState
          title={copy.news.noStoriesTitle}
          description={copy.news.noStoriesDescription}
        />
      )}

      <div className="space-y-5">
        {storyCards.map((story, index) => {
          const storyBreakdown = story.storyBreakdown ?? [];
          const hasDetails = storyBreakdown.length > 0 || story.angles.length > 0;
          const isExpanded = expandedStoryIds.has(story.id);

          return (
            <article
              key={story.id}
              className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-secondary">
                    {story.isWatchUpdate ? copy.news.watchUpdate : copy.news.story(index + 1)}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                    {story.title}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-md bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-400 dark:bg-zinc-700/60 dark:text-zinc-400">
                    {story.score}
                  </span>
                  {story.generatedAt && (
                    <span className="text-[11px] text-zinc-400">
                      {formatShortTime(story.generatedAt, appLanguage)}
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {story.summary}
              </p>

              {story.imageUrl && hasVisualInterest(story.matchedInterests) && (
                <figure className="mt-4 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                  <Image
                    src={story.imageUrl}
                    alt=""
                    width={960}
                    height={360}
                    unoptimized
                    className="w-full object-scale-down"
                  />
                  {story.imageSource && (
                    <figcaption className="px-3 py-1.5 text-[11px] text-zinc-400">
                      {copy.news.image} {story.imageSource}
                    </figcaption>
                  )}
                </figure>
              )}

              {story.whyItMatters && (
                <div className="mt-4 rounded-md border border-muted bg-muted/60 p-3 dark:border-primary-hover dark:bg-primary-hover/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
                    {copy.news.whyItMatters}
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

              {hasDetails && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => toggleStoryDetails(story.id)}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {copy.news.details}
                    <ChevronDown
                      className={
                        "h-3.5 w-3.5 transition-transform " +
                        (isExpanded ? "rotate-180" : "")
                      }
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-4 rounded-md border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
                      {storyBreakdown.length > 0 && (
                        <div className="space-y-3">
                          {storyBreakdown.map((item) => (
                            <div key={`${story.id}-${item.title}`} className="space-y-1.5">
                              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                {item.title}
                              </p>
                              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                {item.summary}
                              </p>
                              {item.sourceUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {item.sourceUrls.map((url) => {
                                    const source = sourceForUrl(story, url);
                                    return (
                                      <a
                                        key={url}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-medium text-zinc-500 hover:border-primary hover:text-primary dark:border-zinc-600 dark:text-zinc-300"
                                      >
                                        {source ? sourceLabel(source) : copy.news.source}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {story.angles.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            {copy.news.sourceAngles}
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {story.angles.map((angle) => (
                              <li
                                key={angle}
                                className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
                              >
                                {angle}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-700">
                {story.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {story.sources.map((source) => (
                      <div key={source.url} className="flex items-center gap-1">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-primary hover:text-primary dark:border-zinc-600 dark:text-zinc-300"
                        >
                          {sourceLabel(source)}
                        </a>
                        <ActionButton
                          onClick={() => saveSource(story, source)}
                          disabled={savedUrls.has(source.url) || savingUrls.has(source.url)}
                          variant="ghost"
                          className="min-h-7 w-7 rounded-full px-0 py-0"
                          aria-label={savedUrls.has(source.url) ? copy.news.saved : copy.news.save}
                        >
                          {savedUrls.has(source.url) ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <BookmarkPlus className="h-3.5 w-3.5" />
                          )}
                        </ActionButton>
                      </div>
                    ))}
                  </div>
                )}

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => sendFeedback(story.id, "up")}
                    aria-label={copy.news.thumbsUp}
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
                    aria-label={copy.news.thumbsDown}
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
          );
        })}
      </div>
    </section>
  );
}
