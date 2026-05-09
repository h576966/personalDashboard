import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import {
  deleteWatchTopic,
  updateWatchTopic,
} from "@/lib/db/watchTopics";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function stringList(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;

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

  return undefined;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
      return errorResponse("enabled must be a boolean", "INVALID_INPUT", 400);
    }

    if (body.name !== undefined && typeof body.name !== "string") {
      return errorResponse("name must be a string", "INVALID_INPUT", 400);
    }

    const topic = await updateWatchTopic(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      queries: stringList(body.queries),
      sourceDomains: stringList(body.sourceDomains),
      enabled: body.enabled,
    });

    return NextResponse.json({ topic });
  } catch (error) {
    console.error("PATCH news-watch-topic failed", error);
    return errorResponse("Failed to update watch topic", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteWatchTopic(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE news-watch-topic failed", error);
    return errorResponse("Failed to delete watch topic", "INTERNAL_ERROR", 500);
  }
}
