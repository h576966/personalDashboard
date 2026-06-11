import {
  fallbackWatchTopicSuggestion as fallbackWatchTopicSuggestionImpl,
  normalizeDomain as normalizeDomainImpl,
  normalizeWatchTopicSuggestion as normalizeWatchTopicSuggestionImpl,
  parseWatchTopicSuggestionContent as parseWatchTopicSuggestionContentImpl,
} from "./suggestions.mjs";

export interface WatchTopicSuggestion {
  name: string;
  queries: string[];
  sourceDomains: string[];
}

export function normalizeDomain(value: unknown): string {
  return normalizeDomainImpl(value) as string;
}

export function fallbackWatchTopicSuggestion(topic: string): WatchTopicSuggestion {
  return fallbackWatchTopicSuggestionImpl(topic) as WatchTopicSuggestion;
}

export function normalizeWatchTopicSuggestion(topic: string, raw: unknown): WatchTopicSuggestion {
  return normalizeWatchTopicSuggestionImpl(topic, raw) as WatchTopicSuggestion;
}

export function parseWatchTopicSuggestionContent(
  topic: string,
  content: string,
): WatchTopicSuggestion {
  return parseWatchTopicSuggestionContentImpl(topic, content) as WatchTopicSuggestion;
}
