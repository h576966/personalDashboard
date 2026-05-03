import { NextResponse } from "next/server";
import { getTodaysBriefing } from "@/lib/db/newsItems";
import { errorResponse } from "@/lib/api/errors";

export async function GET() {
  try {
    const items = await getTodaysBriefing();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Failed to get briefing:", err);
    return errorResponse("Failed to get briefing", "INTERNAL_ERROR", 500);
  }
}
