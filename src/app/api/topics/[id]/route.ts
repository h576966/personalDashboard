import { NextResponse } from "next/server";
import { deleteTopic } from "@/lib/db/topics";
import { errorResponse } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  _req: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    await deleteTopic(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE topic failed", error);
    return errorResponse("Failed to delete topic", "INTERNAL_ERROR", 500);
  }
}
