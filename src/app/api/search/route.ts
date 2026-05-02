import { NextRequest, NextResponse } from "next/server";
import { searchBrave, BraveSearchError } from "@/lib/brave";
import { processSearchResults } from "@/lib/search";
import { searchCache, type CacheEntry } from "@/lib/cache";
import {
  rewriteQuery,
  summarizeResults,
  DeepSeekError,
} from "@/lib/deepseek";

const MIN_COUNT = 1;
const MAX_COUNT = 20;
const DEFAULT_COUNT = 10;

const VALID_FRESHNESS = new Set(["pd", "pw", "pm", "py"]);

const VALID_COUNTRIES = new Set([
  "US", "GB", "DE", "FR", "JP", "CA", "AU", "IN", "SE", "NO",
]);

interface SearchRequestBody {
  query?: string;
  count?: number;
  freshness?: string;
  country?: string;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

type Freshness = "pd" | "pw" | "pm" | "py";

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

  let parsedCount = DEFAULT_COUNT;

  if (count !== undefined) {
    if (typeof count !== "number" || !Number.isInteger(count)) {
      return null;
    }
    if (count < MIN_COUNT || count > MAX_COUNT) {
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

function errorResponse(
  message: string,
  code: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { error: { message, code } },
    { status },
  );
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
    if (cached) {
      return NextResponse.json({
        results: cached.results,
        ...(cached.summary !== undefined && { summary: cached.summary }),
        ...(cached.suggestions !== undefined && {
          suggestions: cached.suggestions,
        }),
        ...(cached.rewrittenQuery !== undefined && {
          rewrittenQuery: cached.rewrittenQuery,
        }),
      });
    }

    // Rewrite query via DeepSeek (fall back to original on error)
    let searchQuery = validated.query;
    let rewrittenQuery: string | undefined;

    try {
      rewrittenQuery = await rewriteQuery(validated.query);
      searchQuery = rewrittenQuery;
    } catch (err) {
      if (err instanceof DeepSeekError) {
        console.warn("Query rewrite failed, using original:", err.message);
      } else {
        console.warn("Unexpected query rewrite error:", err);
      }
    }

    let rawResults;
    try {
      rawResults = await searchBrave(
        searchQuery,
        validated.count,
        validated.freshness,
        validated.country,
      );
    } catch (err) {
      if (err instanceof BraveSearchError) {
        return errorResponse(
          `Search API error: ${err.message}`,
          "UPSTREAM_ERROR",
          502,
        );
      }
      throw err;
    }

    const results = processSearchResults(
      rawResults.web?.results ?? [],
      searchQuery,
    );

    // Summarize results via DeepSeek (graceful fallback on error)
    let summary: string | undefined;
    let suggestions: string[] | undefined;

    if (results.length > 0) {
      try {
        const top5 = results.slice(0, 5).map((r) => ({
          title: r.title,
          description: r.description,
          url: r.url,
        }));
        const result = await summarizeResults(searchQuery, top5);
        summary = result.summary;
        suggestions = result.suggestions;
      } catch (err) {
        if (err instanceof DeepSeekError) {
          console.warn("Result summary failed:", err.message);
        } else {
          console.warn("Unexpected summary error:", err);
        }
      }
    }

    const cacheEntry: CacheEntry = {
      results,
      summary,
      suggestions,
      rewrittenQuery,
      timestamp: Date.now(),
    };

    searchCache.set(cacheKey, cacheEntry);

    return NextResponse.json({
      results,
      ...(summary !== undefined && { summary }),
      ...(suggestions !== undefined && { suggestions }),
      ...(rewrittenQuery !== undefined && { rewrittenQuery }),
    });
  } catch (err) {
    console.error("Unexpected search error:", err);
    return errorResponse(
      "An unexpected error occurred",
      "INTERNAL_ERROR",
      500,
    );
  }
}
