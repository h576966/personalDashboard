import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { summaryCache, type SummaryCacheEntry } from "@/lib/cache";
import { DeepSeekError, summarizeResults, type SearchResultItem } from "@/lib/deepseek";

interface SummaryRequestBody {
  query?: string;
  results?: SearchResultItem[];
}

function validateBody(body: unknown): { query: string; results: SearchResultItem[] } | null {
  if (typeof body !== "object" || body === null) return null;

  const { query, results } = body as SummaryRequestBody;
  if (typeof query !== "string" || query.trim().length === 0) return null;
  if (!Array.isArray(results) || results.length === 0) return null;

  const cleanResults = results
    .slice(0, 5)
    .map((result) => ({
      title: typeof result.title === "string" ? result.title.trim() : "",
      description: typeof result.description === "string" ? result.description.trim() : "",
      url: typeof result.url === "string" ? result.url.trim() : "",
    }))
    .filter((result) => result.title && result.url);

  if (cleanResults.length === 0) return null;

  return {
    query: query.trim(),
    results: cleanResults,
  };
}

function cacheKey(query: string, results: SearchResultItem[]): string {
  return `${query}|${results.map((result) => result.url).join("|")}`;
}

function cachedResponse(entry: SummaryCacheEntry, stale = false) {
  return NextResponse.json({
    summary: entry.summary,
    suggestions: entry.suggestions,
    ...(stale && { stale: true }),
  });
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", "INVALID_JSON", 400);
    }

    const validated = validateBody(body);
    if (!validated) {
      return errorResponse(
        "query and at least one result are required",
        "INVALID_INPUT",
        400,
      );
    }

    const key = cacheKey(validated.query, validated.results);
    const cached = summaryCache.get(key);
    if (cached) return cachedResponse(cached);
    const stale = summaryCache.get(key, { allowStale: true });

    try {
      const result = await summarizeResults(validated.query, validated.results);
      const entry: SummaryCacheEntry = {
        summary: result.summary,
        suggestions: result.suggestions,
        timestamp: Date.now(),
      };

      summaryCache.set(key, entry);
      return cachedResponse(entry);
    } catch (err) {
      if (stale) return cachedResponse(stale, true);

      if (err instanceof DeepSeekError) {
        return errorResponse(`Summary error: ${err.message}`, "UPSTREAM_ERROR", 502);
      }

      throw err;
    }
  } catch (err) {
    console.error("Unexpected search summary error:", err);
    return errorResponse("An unexpected error occurred", "INTERNAL_ERROR", 500);
  }
}
