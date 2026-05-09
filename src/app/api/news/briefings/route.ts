import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { getTodaysStoryCards } from "@/lib/db/storyClusters";
import { buildDailyNewsBriefing } from "@/lib/news/briefing";

async function buildAndReturn() {
  const briefing = await buildDailyNewsBriefing();
  return NextResponse.json({ briefing, source: "fresh" });
}

export async function GET(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get("refresh") === "true";
    if (refresh) return await buildAndReturn();

    const storyCards = await getTodaysStoryCards();
    if (storyCards.length > 0) {
      return NextResponse.json({
        briefing: {
          storyCards,
          generatedAt: storyCards[0]?.generatedAt ?? new Date().toISOString(),
        },
        source: "cache",
      });
    }

    return await buildAndReturn();
  } catch (err) {
    console.error("Failed to build news briefings:", err);
    return errorResponse("Failed to build news briefings", "INTERNAL_ERROR", 500);
  }
}

export async function POST() {
  try {
    return await buildAndReturn();
  } catch (err) {
    console.error("Failed to refresh news briefings:", err);
    return errorResponse("Failed to refresh news briefings", "INTERNAL_ERROR", 500);
  }
}
