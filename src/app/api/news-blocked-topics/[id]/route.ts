import { NextResponse } from "next/server";
import { updateBlockedTopic } from "@/lib/db/blockedTopics";
import { errorResponse } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
      return errorResponse("enabled must be a boolean", "INVALID_INPUT", 400);
    }

    const topic = await updateBlockedTopic(id, {
      enabled: body.enabled,
    });

    return NextResponse.json({ topic });
  } catch (error) {
    console.error("PATCH news-blocked-topic failed", error);
    return errorResponse("Failed to update muted topic", "INTERNAL_ERROR", 500);
  }
}
