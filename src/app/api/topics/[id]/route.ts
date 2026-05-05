import { NextResponse } from "next/server";
import { deleteTopic } from "@/lib/db/topics";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await deleteTopic(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE topic failed", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 },
    );
  }
}
