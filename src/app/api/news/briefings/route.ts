import { NextResponse } from "next/server";
import { buildDailyNewsBriefing } from "@/lib/news/briefing";

export async function GET() {
  try {
    const briefing = await buildDailyNewsBriefing();
    return NextResponse.json({ briefing });
  } catch (err) {
    console.error("Failed to build news briefings:", err);
    return NextResponse.json(
      { error: { message: "Failed to build news briefings" } },
      { status: 500 },
    );
  }
}
