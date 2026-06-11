import type { BraveWebResult } from "../brave";
import {
  canonicalUrl as canonicalUrlImpl,
  filterResults as filterResultsImpl,
  stripHtml as stripHtmlImpl,
} from "./filter.mjs";

export function stripHtml(text: string): string {
  return stripHtmlImpl(text) as string;
}

export function canonicalUrl(value: string): string {
  return canonicalUrlImpl(value) as string;
}

export interface FilteredResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

export function filterResults(
  results: BraveWebResult[],
): FilteredResult[] {
  return filterResultsImpl(results) as FilteredResult[];
}
