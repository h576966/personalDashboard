import type { BraveWebResult } from "../brave";
import { isBlocked } from "./quality";

export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export interface FilteredResult {
  title: string;
  url: string;
  description: string;
}

export function filterResults(
  results: BraveWebResult[],
): FilteredResult[] {
  const seen = new Set<string>();

  return results.filter((r) => {
    const title = r.title?.trim();
    const url = r.url?.trim();

    if (!title || !url) {
      return false;
    }

    // Block low-quality domains
    if (isBlocked(url)) {
      return false;
    }

    const normalizedUrl = url.toLowerCase();

    if (seen.has(normalizedUrl)) {
      return false;
    }

    seen.add(normalizedUrl);
    return true;
  }).map((r) => ({
    title: r.title.trim(),
    url: r.url.trim(),
    description: stripHtml(r.description ?? ""),
  }));
}
