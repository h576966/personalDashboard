import { NextResponse } from "next/server";
import { processBriefing } from "@/lib/news";
import { errorResponse } from "@/lib/api/errors";

export async function POST() {
  try {
    const result = await processBriefing();
    return NextResponse.json(result);
  } catch (err) {
    console.error("News fetch failed:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch news";
    return errorResponse(message, "FETCH_ERROR", 500);
  }
}
