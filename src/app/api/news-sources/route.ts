import { NextResponse } from "next/server";
import { getNewsSources, seedDefaultNewsSources } from "@/lib/db/newsSources";

export async function GET() {
  try {
    const sources = await getNewsSources();
    return NextResponse.json({ sources });
  } catch (error) {
    console.error("GET news-sources failed", error);
    return NextResponse.json(
      { error: "Failed to load news sources" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    await seedDefaultNewsSources();
    const sources = await getNewsSources();
    return NextResponse.json({ sources });
  } catch (error) {
    console.error("POST news-sources failed", error);
    return NextResponse.json(
      { error: "Failed to seed news sources" },
      { status: 500 },
    );
  }
}
