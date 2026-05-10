import {
  isLikelyStoryImageUrl as isLikelyStoryImageUrlImpl,
  shouldShowStoryImage as shouldShowStoryImageImpl,
  sourceForUrl as sourceForUrlImpl,
  sourceLabel as sourceLabelImpl,
} from "./helpers.mjs";

export interface BriefingSource {
  title: string;
  url: string;
  source?: string;
  description?: string;
}

export interface StoryBreakdownItem {
  title: string;
  summary: string;
  sourceUrls: string[];
}

export interface StoryCard {
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

export function sourceLabel(source: BriefingSource): string {
  return sourceLabelImpl(source);
}

export function sourceForUrl(story: StoryCard, url: string): BriefingSource | undefined {
  return sourceForUrlImpl(story, url) as BriefingSource | undefined;
}

export function isLikelyStoryImageUrl(value: string | undefined): boolean {
  return isLikelyStoryImageUrlImpl(value);
}

export function shouldShowStoryImage(story: StoryCard): boolean {
  return shouldShowStoryImageImpl(story);
}

