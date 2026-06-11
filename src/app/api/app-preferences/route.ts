import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import {
  getAppPreferences,
  updateAppPreferences,
} from "@/lib/db/appPreferences";

export async function GET() {
  try {
    const prefs = await getAppPreferences();
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("GET app-preferences failed", error);
    return errorResponse("Failed to load preferences", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const prefs = await updateAppPreferences({
      app_language: body.app_language,
    });

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("PATCH app-preferences failed", error);
    return errorResponse("Failed to update preferences", "INTERNAL_ERROR", 500);
  }
}
