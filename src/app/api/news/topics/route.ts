import { NextRequest, NextResponse } from "next/server";
import { getTopics, createTopic, type CreateTopicData } from "@/lib/db/topics";

interface ErrorResponse {
  error: { message: string; code: string };
}

function errorResponse(
  message: string,
  code: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: { message, code } }, { status });
}

export async function GET() {
  try {
    const topics = await getTopics();
    return NextResponse.json({ topics });
  } catch (err) {
    console.error("Failed to list topics:", err);
    return errorResponse("Failed to list topics", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", "INVALID_JSON", 400);
    }

    if (typeof body !== "object" || body === null) {
      return errorResponse("Request body must be a JSON object", "INVALID_INPUT", 400);
    }

    const data = body as Record<string, unknown>;

    if (typeof data.name !== "string" || data.name.trim().length === 0) {
      return errorResponse("name is required and must be a non-empty string", "INVALID_INPUT", 400);
    }

    if (!Array.isArray(data.queries) || data.queries.length === 0) {
      return errorResponse("queries is required and must be a non-empty array of strings", "INVALID_INPUT", 400);
    }

    for (const q of data.queries) {
      if (typeof q !== "string" || q.trim().length === 0) {
        return errorResponse("Each query must be a non-empty string", "INVALID_INPUT", 400);
      }
    }

    const topicData: CreateTopicData = {
      name: data.name.trim(),
      description: typeof data.description === "string" ? data.description : undefined,
      queries: data.queries.map((q: string) => q.trim()),
      country: typeof data.country === "string" ? data.country : undefined,
      region: typeof data.region === "string" ? data.region : undefined,
      language: typeof data.language === "string" ? data.language : undefined,
      preferredSources: Array.isArray(data.preferredSources) ? data.preferredSources : undefined,
      blockedSources: Array.isArray(data.blockedSources) ? data.blockedSources : undefined,
      requiredKeywords: Array.isArray(data.requiredKeywords) ? data.requiredKeywords : undefined,
      blockedKeywords: Array.isArray(data.blockedKeywords) ? data.blockedKeywords : undefined,
      maxItemsPerDay: typeof data.maxItemsPerDay === "number" ? data.maxItemsPerDay : undefined,
      minScore: typeof data.minScore === "number" ? data.minScore : undefined,
      enabled: typeof data.enabled === "boolean" ? data.enabled : undefined,
    };

    const topic = await createTopic(topicData);
    return NextResponse.json({ topic }, { status: 201 });
  } catch (err) {
    console.error("Failed to create topic:", err);
    const message = err instanceof Error ? err.message : "Failed to create topic";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}
