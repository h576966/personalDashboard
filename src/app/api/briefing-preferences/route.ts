import { NextResponse } from "next/server";
import {
  getBriefingPreferences,
  updateBriefingPreferences,
} from "@/lib/db/briefingPreferences";

export async function GET() {
  try {
    const prefs = await getBriefingPreferences();
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("GET briefing-preferences failed", error);
    return NextResponse.json(
      { error: "Failed to load preferences" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const prefs = await updateBriefingPreferences(body);
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("PATCH briefing-preferences failed", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
