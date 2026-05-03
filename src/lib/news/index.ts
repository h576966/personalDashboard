import { getTopics } from "@/lib/db/topics";
import {
  getSeenItemByUrl,
  getSeenItemByTitleHash,
  insertNewsItem,
  createRun,
  markRunComplete,
  linkItemToTopic,
} from "@/lib/db/newsItems";
import { fetchTopicNews, type TopicNewsResult } from "./fetch";
import { deduplicate } from "./deduplicate";
import type { ScoredNewsItem } from "./score";
import { GLOBAL_DAILY_LIMIT } from "@/lib/config";

export interface BriefingResult {
  runId: string;
  items: ScoredNewsItem[];
  topicCounts: Record<string, number>;
  totalFetched: number;
  totalAfterDedup: number;
  totalAfterFilter: number;
}

/**
 * Collects and persists a news briefing from all enabled topics.
 *
 * For each enabled topic:
 *  1. Fetches raw results from Brave Search
 *  2. Scores them with the per-topic scoring function
 *  3. Filters below minScore, sorts by score, limits to maxItemsPerDay
 * Then globally:
 *  4. Deduplicates against the DB (existing URL/hash) and within the batch
 *  5. Enforces a global daily limit
 *  6. Persists items and links each to its originating topic
 */
export async function processBriefing(): Promise<BriefingResult> {
  const run = await createRun();

  try {
    const enabledTopics = (await getTopics()).filter((t) => t.enabled);

    if (enabledTopics.length === 0) {
      await markRunComplete(run.id, 0);
      return {
        runId: run.id,
        items: [],
        topicCounts: {},
        totalFetched: 0,
        totalAfterDedup: 0,
        totalAfterFilter: 0,
      };
    }

    // Phase 1: fetch and per-topic score/filter/limit
    const topicResults: TopicNewsResult[] = [];
    const topicCounts: Record<string, number> = {};
    let totalFetched = 0;

    for (const topic of enabledTopics) {
      const result = await fetchTopicNews(topic);
      totalFetched += result.items.length;

      // Apply per-topic thresholds
      result.items = result.items
        .filter((item) => item.score >= topic.minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, topic.maxItemsPerDay);

      topicCounts[topic.name] = result.items.length;
      topicResults.push(result);
    }

    // Flatten scored items, maintaining topic origin via the result structure
    const allScored: ScoredNewsItem[] = topicResults.flatMap((r) => r.items);

    // Phase 2: deduplicate against DB
    const deduplicated: ScoredNewsItem[] = [];

    for (const item of allScored) {
      const existingByUrl = await getSeenItemByUrl(item.url);
      if (existingByUrl) continue;

      const existingByHash = item.titleHash
        ? await getSeenItemByTitleHash(item.titleHash)
        : null;
      if (existingByHash) continue;

      deduplicated.push(item);
    }

    // Phase 3: cross-item dedup within the batch
    const finalItems = deduplicate(deduplicated, []);

    // Phase 4: global daily limit
    const limited = finalItems.slice(0, GLOBAL_DAILY_LIMIT);

    // Phase 5: persist items and link to their originating topics
    // Build a lookup: item URL → set of topic IDs that produced it
    const urlToTopicIds = new Map<string, Set<string>>();
    const urlToScore = new Map<string, number>();

    for (const tr of topicResults) {
      for (const item of tr.items) {
        const key = item.url.toLowerCase();
        if (!urlToTopicIds.has(key)) {
          urlToTopicIds.set(key, new Set());
        }
        urlToTopicIds.get(key)!.add(tr.topicId);
        // Keep the highest score across topics
        const existing = urlToScore.get(key);
        if (existing === undefined || item.score > existing) {
          urlToScore.set(key, item.score);
        }
      }
    }

    for (const item of limited) {
      const inserted = await insertNewsItem({
        title: item.title,
        url: item.url,
        description: item.description,
        source: item.source,
        score: item.score,
        titleHash: item.titleHash,
      });

      const topicIds = urlToTopicIds.get(item.url.toLowerCase());
      const bestScore = urlToScore.get(item.url.toLowerCase()) ?? item.score;

      if (topicIds && topicIds.size > 0) {
        for (const topicId of topicIds) {
          await linkItemToTopic(inserted.id, topicId, bestScore, run.id);
        }
      }
    }

    await markRunComplete(run.id, limited.length);

    return {
      runId: run.id,
      items: limited,
      topicCounts,
      totalFetched,
      totalAfterDedup: deduplicated.length,
      totalAfterFilter: limited.length,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await markRunComplete(run.id, 0, errorMessage);
    throw err;
  }
}
