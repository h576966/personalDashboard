import { NextResponse } from "next/server";
import { buildNewsBriefings } from "@/lib/news/briefing";

export async function GET() {
  try {
    const briefings = await buildNewsBriefings();
    return NextResponse.json({ briefings });
  } catch (err) {
    console.error("Failed to build news briefings:", err);
    return NextResponse.json(
      { error: { message: "Failed to build news briefings" } },
      { status: 500 },
    );
  }
}
