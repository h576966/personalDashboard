import { NextResponse } from "next/server";
import { getNewsSources, seedDefaultNewsSources } from "@/lib/db/newsSources";
import { errorResponse } from "@/lib/api/errors";

export async function GET() {
  try {
    const sources = await getNewsSources();
    return NextResponse.json({ sources });
  } catch (error) {
    console.error("GET news-sources failed", error);
    return errorResponse("Failed to load news sources", "INTERNAL_ERROR", 500);
  }
}

export async function POST() {
  try {
    const sources = await seedDefaultNewsSources();
    return NextResponse.json({ sources });
  } catch (error) {
    console.error("POST news-sources failed", error);
    return errorResponse("Failed to seed news sources", "INTERNAL_ERROR", 500);
  }
}
