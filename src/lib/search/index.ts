import type { BraveWebResult } from "../brave";
import { filterResults } from "./filter";
import { diversifyResults, scoreResult, type ScoredResult } from "./score";

export { canonicalUrl, filterResults } from "./filter";
export {
  diversifyResults,
  isBetterResultSet,
  scoreResult,
  searchTerms,
  shouldRewriteQuery,
} from "./score";
export { isBlocked, isBoosted } from "./quality";
export type { FilteredResult } from "./filter";
export type { ScoredResult } from "./score";
export type { QualifiableResult } from "./quality";

export function processSearchResults(
  rawResults: BraveWebResult[],
  query: string,
): ScoredResult[] {
  const filtered = filterResults(rawResults);
  const scored = filtered.map((r) => scoreResult(r, query));
  scored.sort((a, b) => b.score - a.score);
  return diversifyResults(scored);
}
