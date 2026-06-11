import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import {
  deleteWatchTopic,
  updateWatchTopic,
} from "@/lib/db/watchTopics";
import { normalizeDomain } from "@/lib/watchTopics/suggestions";

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

function domainList(value: unknown): string[] | undefined {
  const values = stringList(value);
  return values?.map((domain) => normalizeDomain(domain)).filter(Boolean);
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

    const queries = stringList(body.queries);

    if (typeof body.name === "string" && !body.name.trim()) {
      return errorResponse("Watch topic name is required", "INVALID_INPUT", 400);
    }

    if (body.queries !== undefined && (!queries || queries.length === 0)) {
      return errorResponse("At least one query is required", "INVALID_INPUT", 400);
    }

    const topic = await updateWatchTopic(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      queries,
      sourceDomains: domainList(body.sourceDomains),
      enabled: body.enabled,
    });

    return NextResponse.json({ topic });
  } catch (error) {
    console.error("PATCH watch-topic failed", error);
    return errorResponse("Failed to update watch topic", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteWatchTopic(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE watch-topic failed", error);
    return errorResponse("Failed to delete watch topic", "INTERNAL_ERROR", 500);
  }
}
