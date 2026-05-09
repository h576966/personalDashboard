import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { authErrorResponse, requireCurrentHousehold } from "@/lib/auth/household";
import { getTodaysStoryCards } from "@/lib/db/storyClusters";
import { buildDailyNewsBriefing } from "@/lib/news/briefing";

async function buildAndReturn(householdId: string) {
  const briefing = await buildDailyNewsBriefing(householdId);
  return NextResponse.json({ briefing, source: "fresh" });
}

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireCurrentHousehold();
    const refresh = request.nextUrl.searchParams.get("refresh") === "true";
    if (refresh) return await buildAndReturn(householdId);

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

    return await buildAndReturn(householdId);
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    console.error("Failed to build news briefings:", err);
    return errorResponse("Failed to build news briefings", "INTERNAL_ERROR", 500);
  }
}

export async function POST() {
  try {
    const { householdId } = await requireCurrentHousehold();
    return await buildAndReturn(householdId);
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    console.error("Failed to refresh news briefings:", err);
    return errorResponse("Failed to refresh news briefings", "INTERNAL_ERROR", 500);
  }
}
