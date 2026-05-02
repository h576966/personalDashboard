import { searchBrave } from "@/lib/brave";
import { stripHtml } from "@/lib/search/filter";
import type { NewsTopic } from "@/lib/db/topics";
import { scoreNewsItem, type ScoredNewsItem } from "./score";

export interface TopicNewsResult {
  topicId: string;
  topicName: string;
  items: ScoredNewsItem[];
}

export async function fetchTopicNews(topic: NewsTopic): Promise<TopicNewsResult> {
  const allScored: ScoredNewsItem[] = [];
  const seenUrls = new Set<string>();

  for (const query of topic.queries) {
    const trimmed = query.trim();
    if (!trimmed) continue;

    try {
      const response = await searchBrave(trimmed, 10, "pw");
      const results = response.web?.results ?? [];

      for (const result of results) {
        const title = result.title?.trim();
        const url = result.url?.trim();

        if (!title || !url) continue;

        const urlLower = url.toLowerCase();
        if (seenUrls.has(urlLower)) continue;
        seenUrls.add(urlLower);

        const scored = scoreNewsItem(
          {
            title,
            url,
            description: stripHtml(result.description ?? ""),
            age: result.age,
          },
          topic,
        );

        allScored.push(scored);
      }
    } catch (err) {
      console.warn(`Failed to fetch news for query "${trimmed}":`, err);
    }
  }

  return { topicId: topic.id, topicName: topic.name, items: allScored };
}
