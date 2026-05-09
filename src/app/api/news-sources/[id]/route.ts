import { NextResponse } from "next/server";
import { updateNewsSource, type UpdateNewsSourceData } from "@/lib/db/newsSources";
import { errorResponse } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as Record<string, unknown>;
    const update: UpdateNewsSourceData = {};

    if (body.enabled !== undefined) {
      if (typeof body.enabled !== "boolean") {
        return errorResponse("enabled must be a boolean", "INVALID_INPUT", 400);
      }
      update.enabled = body.enabled;
    }

    if (body.priority !== undefined) {
      if (typeof body.priority !== "number" || !Number.isInteger(body.priority)) {
        return errorResponse("priority must be an integer", "INVALID_INPUT", 400);
      }
      update.priority = body.priority;
    }

    const source = await updateNewsSource(id, update);
    return NextResponse.json({ source });
  } catch (error) {
    console.error("PATCH news-source failed", error);
    return errorResponse("Failed to update news source", "INTERNAL_ERROR", 500);
  }
}
