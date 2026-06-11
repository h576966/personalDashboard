import { NextRequest, NextResponse } from "next/server";
import { searchBrave, BraveSearchError } from "@/lib/brave";
import {
  isBetterResultSet,
  processSearchResults,
  shouldRewriteQuery,
  type ScoredResult,
} from "@/lib/search";
import { searchCache, type CacheEntry } from "@/lib/cache";
import { COUNTRY_VALUES } from "@/lib/countries";
import { errorResponse } from "@/lib/api/errors";
import {
  rewriteQuery,
  DeepSeekError,
} from "@/lib/deepseek";
import {
  SEARCH_MIN_COUNT,
  SEARCH_MAX_COUNT,
  SEARCH_DEFAULT_COUNT,
  SEARCH_CACHE_TTL_BY_FRESHNESS,
  SEARCH_UPSTREAM_TIMEOUT_MS,
} from "@/lib/config";

const VALID_FRESHNESS = new Set(["pd", "pw", "pm", "py"]);

// VALID_COUNTRIES is derived from COUNTRY_OPTIONS in src/lib/countries.ts
const VALID_COUNTRIES = COUNTRY_VALUES;

interface SearchRequestBody {
  query?: string;
  count?: number;
  freshness?: string;
  country?: string;
}

type Freshness = "pd" | "pw" | "pm" | "py";

function cacheTtl(freshness: Freshness | undefined): number {
  return freshness
    ? SEARCH_CACHE_TTL_BY_FRESHNESS[freshness]
    : SEARCH_CACHE_TTL_BY_FRESHNESS.default;
}

function cachedResponse(entry: CacheEntry, stale = false) {
  return NextResponse.json({
    results: entry.results,
    ...(entry.rewrittenQuery !== undefined && {
      rewrittenQuery: entry.rewrittenQuery,
    }),
    ...(stale && { stale: true }),
  });
}

async function searchWithTimeout(
  query: string,
  count: number,
  freshness: Freshness | undefined,
  country: string | undefined,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_UPSTREAM_TIMEOUT_MS);

  try {
    return await searchBrave(query, count, freshness, country, {
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new BraveSearchError("Search API timed out", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function maybeRewriteWeakSearch(
  originalQuery: string,
  currentResults: ScoredResult[],
  count: number,
  freshness: Freshness | undefined,
  country: string | undefined,
): Promise<{ results: ScoredResult[]; rewrittenQuery?: string }> {
  if (!shouldRewriteQuery(originalQuery, currentResults)) {
    return { results: currentResults };
  }

  try {
    const rewrittenQuery = await rewriteQuery(originalQuery);
    const normalizedRewrite = rewrittenQuery.trim();

    if (!normalizedRewrite || normalizedRewrite.toLowerCase() === originalQuery.toLowerCase()) {
      return { results: currentResults };
    }

    const rewrittenRawResults = await searchWithTimeout(
      normalizedRewrite,
      count,
      freshness,
      country,
    );
    const rewrittenResults = processSearchResults(
      rewrittenRawResults.web?.results ?? [],
      normalizedRewrite,
    );

    if (isBetterResultSet(rewrittenResults, currentResults)) {
      return { results: rewrittenResults, rewrittenQuery: normalizedRewrite };
    }
  } catch (err) {
    if (err instanceof DeepSeekError || err instanceof BraveSearchError) {
      console.warn("Weak search rewrite skipped:", err.message);
    } else {
      console.warn("Unexpected weak search rewrite error:", err);
    }
  }

  return { results: currentResults };
}

function validateBody(body: unknown): {
  query: string;
  count: number;
  freshness: Freshness | undefined;
  country: string | undefined;
} | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { query, count, freshness, country } = body as SearchRequestBody;

  if (typeof query !== "string" || query.trim().length === 0) {
    return null;
  }

  let parsedCount = SEARCH_DEFAULT_COUNT;

  if (count !== undefined) {
    if (typeof count !== "number" || !Number.isInteger(count)) {
      return null;
    }
    if (count < SEARCH_MIN_COUNT || count > SEARCH_MAX_COUNT) {
      return null;
    }
    parsedCount = count;
  }

  let parsedFreshness: Freshness | undefined;

  if (freshness !== undefined) {
    if (typeof freshness !== "string" || !VALID_FRESHNESS.has(freshness)) {
      return null;
    }
    parsedFreshness = freshness as Freshness;
  }

  let parsedCountry: string | undefined;

  if (country !== undefined) {
    if (typeof country !== "string" || !VALID_COUNTRIES.has(country)) {
      return null;
    }
    parsedCountry = country;
  }

  return {
    query: query.trim(),
    count: parsedCount,
    freshness: parsedFreshness,
    country: parsedCountry,
  };
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "Invalid JSON in request body",
        "INVALID_JSON",
        400,
      );
    }

    const validated = validateBody(body);

    if (!validated) {
      return errorResponse(
        "query is required and must be a non-empty string. count is optional (1–20). freshness must be one of: pd, pw, pm, py.",
        "INVALID_INPUT",
        400,
      );
    }

    // Check cache
    const cacheKey = `${validated.query}|${validated.count}|${validated.freshness ?? "any"}|${validated.country ?? "any"}`;
    const cached = searchCache.get(cacheKey);
    if (cached) return cachedResponse(cached);
    const stale = searchCache.get(cacheKey, { allowStale: true });

    let rawResults;
    try {
      rawResults = await searchWithTimeout(
        validated.query,
        validated.count,
        validated.freshness,
        validated.country,
      );
    } catch (err) {
      if (err instanceof BraveSearchError) {
        if (stale) return cachedResponse(stale, true);
        return errorResponse(
          `Search API error: ${err.message}`,
          "UPSTREAM_ERROR",
          502,
        );
      }
      throw err;
    }

    const directResults = processSearchResults(
      rawResults.web?.results ?? [],
      validated.query,
    );

    const { results, rewrittenQuery } = await maybeRewriteWeakSearch(
      validated.query,
      directResults,
      validated.count,
      validated.freshness,
      validated.country,
    );

    const cacheEntry: CacheEntry = {
      results,
      rewrittenQuery,
      timestamp: Date.now(),
      ttlMs: cacheTtl(validated.freshness),
    };

    searchCache.set(cacheKey, cacheEntry);

    return cachedResponse(cacheEntry);
  } catch (err) {
    console.error("Unexpected search error:", err);
    return errorResponse(
      "An unexpected error occurred",
      "INTERNAL_ERROR",
      500,
    );
  }
}
