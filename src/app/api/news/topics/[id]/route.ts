import { NextRequest, NextResponse } from "next/server";
import {
  getTopic,
  updateTopic,
  deleteTopic,
  type UpdateTopicData,
} from "@/lib/db/topics";

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

function getId(request: NextRequest): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idStr = segments[segments.length - 1];
  if (!idStr || idStr.length === 0) return null;
  // UUIDs are 36-character strings (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  if (idStr.length < 32) return null;
  return idStr;
}

export async function GET(request: NextRequest) {
  try {
    const id = getId(request);
    if (id === null) {
      return errorResponse("Invalid topic id", "INVALID_INPUT", 400);
    }

    const topic = await getTopic(id);
    if (!topic) {
      return errorResponse("Topic not found", "NOT_FOUND", 404);
    }

    return NextResponse.json({ topic });
  } catch (err) {
    console.error("Failed to get topic:", err);
    return errorResponse("Failed to get topic", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const id = getId(request);
    if (id === null) {
      return errorResponse("Invalid topic id", "INVALID_INPUT", 400);
    }

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
    const updateData: UpdateTopicData = {};

    if (data.name !== undefined) {
      if (typeof data.name !== "string" || data.name.trim().length === 0) {
        return errorResponse("name must be a non-empty string", "INVALID_INPUT", 400);
      }
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      if (typeof data.description !== "string") {
        return errorResponse("description must be a string", "INVALID_INPUT", 400);
      }
      updateData.description = data.description;
    }

    if (data.queries !== undefined) {
      if (!Array.isArray(data.queries) || data.queries.length === 0) {
        return errorResponse("queries must be a non-empty array of strings", "INVALID_INPUT", 400);
      }
      for (const q of data.queries) {
        if (typeof q !== "string" || q.trim().length === 0) {
          return errorResponse("Each query must be a non-empty string", "INVALID_INPUT", 400);
        }
      }
      updateData.queries = data.queries.map((q: string) => q.trim());
    }

    if (data.country !== undefined) {
      if (typeof data.country !== "string") {
        return errorResponse("country must be a string", "INVALID_INPUT", 400);
      }
      updateData.country = data.country;
    }

    if (data.region !== undefined) {
      if (typeof data.region !== "string") {
        return errorResponse("region must be a string", "INVALID_INPUT", 400);
      }
      updateData.region = data.region;
    }

    if (data.language !== undefined) {
      if (typeof data.language !== "string") {
        return errorResponse("language must be a string", "INVALID_INPUT", 400);
      }
      updateData.language = data.language;
    }

    if (data.preferredSources !== undefined) {
      if (!Array.isArray(data.preferredSources)) {
        return errorResponse("preferredSources must be an array of strings", "INVALID_INPUT", 400);
      }
      updateData.preferredSources = data.preferredSources;
    }

    if (data.blockedSources !== undefined) {
      if (!Array.isArray(data.blockedSources)) {
        return errorResponse("blockedSources must be an array of strings", "INVALID_INPUT", 400);
      }
      updateData.blockedSources = data.blockedSources;
    }

    if (data.requiredKeywords !== undefined) {
      if (!Array.isArray(data.requiredKeywords)) {
        return errorResponse("requiredKeywords must be an array of strings", "INVALID_INPUT", 400);
      }
      updateData.requiredKeywords = data.requiredKeywords;
    }

    if (data.blockedKeywords !== undefined) {
      if (!Array.isArray(data.blockedKeywords)) {
        return errorResponse("blockedKeywords must be an array of strings", "INVALID_INPUT", 400);
      }
      updateData.blockedKeywords = data.blockedKeywords;
    }

    if (data.maxItemsPerDay !== undefined) {
      if (typeof data.maxItemsPerDay !== "number" || !Number.isInteger(data.maxItemsPerDay)) {
        return errorResponse("maxItemsPerDay must be an integer", "INVALID_INPUT", 400);
      }
      updateData.maxItemsPerDay = data.maxItemsPerDay;
    }

    if (data.minScore !== undefined) {
      if (typeof data.minScore !== "number" || !Number.isInteger(data.minScore)) {
        return errorResponse("minScore must be an integer", "INVALID_INPUT", 400);
      }
      updateData.minScore = data.minScore;
    }

    if (data.enabled !== undefined) {
      if (typeof data.enabled !== "boolean") {
        return errorResponse("enabled must be a boolean", "INVALID_INPUT", 400);
      }
      updateData.enabled = data.enabled;
    }

    try {
      const topic = await updateTopic(id, updateData);
      return NextResponse.json({ topic });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.includes("not found")) {
        return errorResponse(message, "NOT_FOUND", 404);
      }
      throw err;
    }
  } catch (err) {
    console.error("Failed to update topic:", err);
    return errorResponse("Failed to update topic", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = getId(request);
    if (id === null) {
      return errorResponse("Invalid topic id", "INVALID_INPUT", 400);
    }

    try {
      await deleteTopic(id);
      return NextResponse.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.includes("not found")) {
        return errorResponse(message, "NOT_FOUND", 404);
      }
      throw err;
    }
  } catch (err) {
    console.error("Failed to delete topic:", err);
    return errorResponse("Failed to delete topic", "INTERNAL_ERROR", 500);
  }
}
