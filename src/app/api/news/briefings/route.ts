import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { authErrorResponse, requireCurrentHousehold } from "@/lib/auth/household";
import { getTodaysStoryCards } from "@/lib/db/storyClusters";
import { buildDailyNewsBriefing } from "@/lib/news/briefing";
import { getBriefingGetPayload } from "./payload";

export const maxDuration = 120;

async function buildAndReturn(householdId: string) {
  const briefing = await buildDailyNewsBriefing(householdId);
  return NextResponse.json({ briefing, source: "fresh" });
}

export async function GET() {
  try {
    await requireCurrentHousehold();

    const storyCards = await getTodaysStoryCards();
    return NextResponse.json(getBriefingGetPayload(storyCards));
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    console.error("Failed to get news briefings:", err);
    return errorResponse("Failed to get news briefings", "INTERNAL_ERROR", 500);
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
