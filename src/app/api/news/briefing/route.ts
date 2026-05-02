import { NextResponse } from "next/server";
import { getTodaysBriefing } from "@/lib/db/newsItems";

interface ErrorResponse {
  error: { message: string; code: string };
}

function errorResponse(
  message: string,
  code: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: { message, code } }, { status });
}

export async function GET() {
  try {
    const items = await getTodaysBriefing();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Failed to get briefing:", err);
    return errorResponse("Failed to get briefing", "INTERNAL_ERROR", 500);
  }
}
