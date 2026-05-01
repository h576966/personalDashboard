import type { BraveWebResult } from "../brave";
import { filterResults } from "./filter";
import { scoreResult, type ScoredResult } from "./score";

export { filterResults } from "./filter";
export { scoreResult } from "./score";
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
  return scored;
}
