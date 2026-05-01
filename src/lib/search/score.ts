import type { FilteredResult } from "./filter";
import { isBoosted, qualityHeuristics } from "./quality";

export interface ScoredResult extends FilteredResult {
  score: number;
}

export function scoreResult(
  result: FilteredResult,
  query: string,
): ScoredResult {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  const titleLower = result.title.toLowerCase();
  const descriptionLower = result.description.toLowerCase();

  let score = 0;

  for (const term of terms) {
    if (titleLower.includes(term)) {
      score += 2;
    }
    if (descriptionLower.includes(term)) {
      score += 1;
    }
  }

  if (result.description.length < 50) {
    score -= 1;
  }

  // Quality heuristics
  score += qualityHeuristics(result);

  // Boosted domain bonus
  if (isBoosted(result.url)) {
    score += 3;
  }

  return { ...result, score };
}
