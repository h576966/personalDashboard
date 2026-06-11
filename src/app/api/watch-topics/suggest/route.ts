import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { DeepSeekError, suggestWatchTopic } from "@/lib/deepseek";
import {
  fallbackWatchTopicSuggestion,
  type WatchTopicSuggestion,
} from "@/lib/watchTopics/suggestions";

function isFallbackSuggestion(
  topic: string,
  suggestion: WatchTopicSuggestion,
): boolean {
  const fallback = fallbackWatchTopicSuggestion(topic);
  return (
    suggestion.name === fallback.name &&
    suggestion.sourceDomains.length === 0 &&
    suggestion.queries.length === fallback.queries.length &&
    suggestion.queries.every((query, index) => query === fallback.queries[index])
  );
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON in request body", "INVALID_JSON", 400);
    }

    const topic =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { topic?: unknown }).topic === "string"
        ? (body as { topic: string }).topic.trim()
        : "";

    if (!topic) {
      return errorResponse("topic is required", "INVALID_INPUT", 400);
    }

    try {
      const suggestion = await suggestWatchTopic(topic);
      return NextResponse.json({
        ...suggestion,
        fallback: isFallbackSuggestion(topic, suggestion),
      });
    } catch (error) {
      if (error instanceof DeepSeekError) {
        console.warn("Watch topic suggestion fallback:", error.message);
      } else {
        console.warn("Unexpected watch topic suggestion fallback:", error);
      }

      return NextResponse.json({
        ...fallbackWatchTopicSuggestion(topic),
        fallback: true,
      });
    }
  } catch (error) {
    console.error("POST watch-topics/suggest failed", error);
    return errorResponse("Failed to suggest watch topic", "INTERNAL_ERROR", 500);
  }
}
