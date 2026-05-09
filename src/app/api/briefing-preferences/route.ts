import { NextResponse } from "next/server";
import {
  getBriefingPreferences,
  updateBriefingPreferences,
} from "@/lib/db/briefingPreferences";
import { errorResponse } from "@/lib/api/errors";

export async function GET() {
  try {
    const prefs = await getBriefingPreferences();
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("GET briefing-preferences failed", error);
    return errorResponse("Failed to load preferences", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const prefs = await updateBriefingPreferences(body);
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("PATCH briefing-preferences failed", error);
    return errorResponse("Failed to update preferences", "INTERNAL_ERROR", 500);
  }
}
