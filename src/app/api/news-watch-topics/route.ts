import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import {
  createWatchTopic,
  getWatchTopics,
} from "@/lib/db/watchTopics";

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .flatMap((line) => line.split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function GET() {
  try {
    const topics = await getWatchTopics();
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("GET news-watch-topics failed", error);
    return errorResponse("Failed to load watch topics", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const queries = stringList(body.queries);

    if (!name) {
      return errorResponse("Watch topic name is required", "INVALID_INPUT", 400);
    }

    if (queries.length === 0) {
      return errorResponse("At least one query is required", "INVALID_INPUT", 400);
    }

    const topic = await createWatchTopic({
      name,
      queries,
      sourceDomains: stringList(body.sourceDomains),
      enabled: body.enabled !== false,
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error("POST news-watch-topics failed", error);
    return errorResponse("Failed to save watch topic", "INTERNAL_ERROR", 500);
  }
}
