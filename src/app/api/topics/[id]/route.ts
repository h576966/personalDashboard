import { NextResponse } from "next/server";
import { deleteTopic } from "@/lib/db/topics";

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
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 },
    );
  }
}
