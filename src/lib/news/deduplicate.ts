import type { ScoredNewsItem } from "./score";
import type { NewsItemRow } from "@/lib/db/newsItems";

/**
 * Dice coefficient similarity for two strings.
 * Returns a value between 0 (no similarity) and 1 (identical).
 */
function diceSimilarity(a: string, b: string): number {
  const aNorm = a.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  const bNorm = b.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  if (aNorm === bNorm) return 1;
  if (aNorm.length < 2 || bNorm.length < 2) return 0;

  // Build bigrams
  const bigramsA = new Set<string>();
  for (let i = 0; i < aNorm.length - 1; i++) {
    bigramsA.add(aNorm.slice(i, i + 2));
  }

  let intersection = 0;
  for (let i = 0; i < bNorm.length - 1; i++) {
    if (bigramsA.has(bNorm.slice(i, i + 2))) {
      intersection++;
    }
  }

  const total = aNorm.length - 1 + bNorm.length - 1;
  return total === 0 ? 0 : (2 * intersection) / total;
}

function extractCoreHeadline(title: string): string {
  // Remove source suffix like " - CNN", " | BBC News"
  return title
    .replace(/\s*[-–|]\s*[^-–|]+$/, "")
    .replace(/^[^-–|]+\s*[-–|]\s*/, "")
    .trim();
}

export function deduplicate(
  items: ScoredNewsItem[],
  seenItems: NewsItemRow[],
): ScoredNewsItem[] {
  const seenUrls = new Set(seenItems.map((s) => s.url.toLowerCase()));
  const seenTitleHashes = new Set(seenItems.map((s) => s.titleHash));

  // Also track seen items among the incoming batch for cross-query dedup
  const batchSeen = new Map<string, ScoredNewsItem>(); // url → item
  const batchHashes = new Set<string>();
  const batchCoreHeadlines = new Map<string, string>(); // source normalized → core headline

  const result: ScoredNewsItem[] = [];

  for (const item of items) {
    // 1. Exact URL match (DB or batch)
    if (seenUrls.has(item.url.toLowerCase())) continue;
    if (batchSeen.has(item.url.toLowerCase())) continue;

    // 2. Title hash match (DB)
    if (item.titleHash && seenTitleHashes.has(item.titleHash)) continue;
    if (item.titleHash && batchHashes.has(item.titleHash)) {
      // Keep the higher-scored item
      const existing = [...batchSeen.values()].find(
        (s) => s.titleHash === item.titleHash,
      );
      if (existing && existing.score >= item.score) continue;
      // This item is better, remove the existing one
      if (existing) {
        batchSeen.delete(existing.url.toLowerCase());
      }
    }

    // 3. Dice coefficient similarity > 0.85
    const isDuplicate = [...batchSeen.values()].some(
      (existing) => diceSimilarity(existing.title, item.title) > 0.85,
    );
    if (isDuplicate) continue;

    // 4. Same source + core headline check
    if (item.source) {
      const core = extractCoreHeadline(item.title);
      for (const [, existingHeadline] of batchCoreHeadlines) {
        if (diceSimilarity(core, existingHeadline) > 0.85) {
          // Same source + similar headline → duplicate
          // Don't skip, just penalize (handled at score level)
          break;
        }
      }
    }

    batchSeen.set(item.url.toLowerCase(), item);
    batchHashes.add(item.titleHash);
    if (item.source) {
      batchCoreHeadlines.set(item.source, extractCoreHeadline(item.title));
    }
    result.push(item);
  }

  // Sort by score descending
  result.sort((a, b) => b.score - a.score);

  return result;
}
