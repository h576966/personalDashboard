import { NextResponse } from "next/server";
import { updateNewsSource, type UpdateNewsSourceData } from "@/lib/db/newsSources";

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
        return NextResponse.json(
          { error: "enabled must be a boolean" },
          { status: 400 },
        );
      }
      update.enabled = body.enabled;
    }

    if (body.priority !== undefined) {
      if (typeof body.priority !== "number" || !Number.isInteger(body.priority)) {
        return NextResponse.json(
          { error: "priority must be an integer" },
          { status: 400 },
        );
      }
      update.priority = body.priority;
    }

    const source = await updateNewsSource(id, update);
    return NextResponse.json({ source });
  } catch (error) {
    console.error("PATCH news-source failed", error);
    return NextResponse.json(
      { error: "Failed to update news source" },
      { status: 500 },
    );
  }
}
