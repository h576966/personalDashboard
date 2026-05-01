import { NextRequest, NextResponse } from "next/server";
import { searchBrave, BraveSearchError } from "@/lib/brave";
import { processSearchResults } from "@/lib/search";
import { searchCache } from "@/lib/cache";

const MIN_COUNT = 1;
const MAX_COUNT = 20;
const DEFAULT_COUNT = 10;

const VALID_FRESHNESS = new Set(["pd", "pw", "pm", "py"]);

interface SearchRequestBody {
  query?: string;
  count?: number;
  freshness?: string;
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
} | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { query, count, freshness } = body as SearchRequestBody;

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

  return { query: query.trim(), count: parsedCount, freshness: parsedFreshness };
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
    const cacheKey = `${validated.query}|${validated.count}|${validated.freshness ?? "any"}`;
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ results: cached });
    }

    let rawResults;
    try {
      rawResults = await searchBrave(
        validated.query,
        validated.count,
        validated.freshness,
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
      validated.query,
    );

    searchCache.set(cacheKey, results);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Unexpected search error:", err);
    return errorResponse(
      "An unexpected error occurred",
      "INTERNAL_ERROR",
      500,
    );
  }
}
