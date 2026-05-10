import { getBriefingGetPayload as getBriefingGetPayloadImpl } from "./payload.mjs";
import type { StoryCard } from "@/lib/news/briefing";

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

