import type { FilteredResult } from "./filter";
import {
  diversifyResults as diversifyResultsImpl,
  isBetterResultSet as isBetterResultSetImpl,
  scoreResult as scoreResultImpl,
  searchTerms as searchTermsImpl,
  shouldRewriteQuery as shouldRewriteQueryImpl,
} from "./score.mjs";

export interface ScoredResult extends FilteredResult {
  score: number;
}

export function searchTerms(query: string): string[] {
  return searchTermsImpl(query) as string[];
}

export function scoreResult(
  result: FilteredResult,
  query: string,
): ScoredResult {
  return scoreResultImpl(result, query) as ScoredResult;
}

export function diversifyResults(results: ScoredResult[], maxPerDomain = 2): ScoredResult[] {
  return diversifyResultsImpl(results, maxPerDomain) as ScoredResult[];
}

export function shouldRewriteQuery(query: string, results: ScoredResult[]): boolean {
  return shouldRewriteQueryImpl(query, results) as boolean;
}

export function isBetterResultSet(candidate: ScoredResult[], current: ScoredResult[]): boolean {
  return isBetterResultSetImpl(candidate, current) as boolean;
}
