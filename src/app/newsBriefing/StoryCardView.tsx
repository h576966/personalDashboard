"use client";

import Image from "next/image";
import { BookmarkPlus, Check, ChevronDown, ThumbsDown, ThumbsUp } from "lucide-react";
import { ActionButton } from "../components/ModuleChrome";
import { formatShortTime, type AppCopy, type AppLanguage } from "@/lib/i18n";
import type { BriefingSource, StoryCard } from "./helpers";
import { shouldShowStoryImage, sourceForUrl, sourceLabel } from "./helpers";

interface StoryCardViewProps {
  story: StoryCard;
  index: number;
  appLanguage: AppLanguage;
  copy: AppCopy;
  isExpanded: boolean;
  currentFeedback?: "up" | "down";
  savedUrls: Set<string>;
  savingUrls: Set<string>;
  onToggleDetails: (storyId: string) => void;
  onSaveSource: (story: StoryCard, source: BriefingSource) => void | Promise<void>;
  onFeedback: (storyId: string, vote: "up" | "down") => void | Promise<void>;
}

export default function StoryCardView({
  story,
  index,
  appLanguage,
  copy,
  isExpanded,
  currentFeedback,
  savedUrls,
  savingUrls,
  onToggleDetails,
  onSaveSource,
  onFeedback,
}: StoryCardViewProps) {
  const storyBreakdown = story.storyBreakdown ?? [];
  const hasDetails = storyBreakdown.length > 0 || story.angles.length > 0;
  const showImage = shouldShowStoryImage(story);

  return (
    <article
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

      <div className={showImage ? "mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-start" : "mt-3"}>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{story.summary}</p>

        {showImage && story.imageUrl && (
          <figure className="order-first overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 sm:order-none">
            <div className="relative h-28 w-full sm:h-24">
              <Image
                src={story.imageUrl}
                alt=""
                fill
                sizes="(min-width: 640px) 144px, 100vw"
                unoptimized
                className="object-cover"
              />
            </div>
            {story.imageSource && (
              <figcaption className="truncate px-2 py-1 text-[10px] text-zinc-400">
                {copy.news.image} {story.imageSource}
              </figcaption>
            )}
          </figure>
        )}
      </div>

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
            onClick={() => onToggleDetails(story.id)}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {copy.news.details}
            <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (isExpanded ? "rotate-180" : "")} />
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-4 rounded-md border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
              {storyBreakdown.length > 0 && (
                <div className="space-y-3">
                  {storyBreakdown.map((item) => (
                    <div key={`${story.id}-${item.title}`} className="space-y-1.5">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{item.title}</p>
                      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item.summary}</p>
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
                      <li key={angle} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
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
                  onClick={() => onSaveSource(story, source)}
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
            onClick={() => onFeedback(story.id, "up")}
            aria-label={copy.news.thumbsUp}
            className={
              "rounded-md border p-1.5 transition-colors " +
              (currentFeedback === "up"
                ? "border-primary bg-muted text-primary"
                : "border-zinc-300 text-zinc-500 hover:border-primary hover:text-primary dark:border-zinc-600")
            }
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onFeedback(story.id, "down")}
            aria-label={copy.news.thumbsDown}
            className={
              "rounded-md border p-1.5 transition-colors " +
              (currentFeedback === "down"
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
}

