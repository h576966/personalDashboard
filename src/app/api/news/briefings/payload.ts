import {
  getBriefingGetPayload as getBriefingGetPayloadImpl,
  latestEnabledTopicUpdatedAt as latestEnabledTopicUpdatedAtImpl,
  shouldRefreshBriefingForTopics as shouldRefreshBriefingForTopicsImpl,
} from "./payload.mjs";
import type { StoryCard } from "@/lib/news/briefing";
import type { NewsTopic } from "@/lib/db/topics";

interface BriefingGetPayload {
  briefing: {
    storyCards: StoryCard[];
    generatedAt: string;
  } | null;
  source: "cache" | "empty";
}

export function getBriefingGetPayload(storyCards: StoryCard[], nowIso?: string): BriefingGetPayload {
  return getBriefingGetPayloadImpl(storyCards, nowIso) as BriefingGetPayload;
}

export function latestEnabledTopicUpdatedAt(topics: NewsTopic[]): number {
  return latestEnabledTopicUpdatedAtImpl(topics) as number;
}

export function shouldRefreshBriefingForTopics(storyCards: StoryCard[], topics: NewsTopic[]): boolean {
  return shouldRefreshBriefingForTopicsImpl(storyCards, topics) as boolean;
}
