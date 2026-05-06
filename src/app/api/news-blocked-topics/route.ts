import { NextResponse } from "next/server";
import {
  createBlockedTopic,
  getBlockedTopics,
  seedDefaultBlockedTopics,
} from "@/lib/db/blockedTopics";

function parseKeywords(value: unknown, label: string): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [label];
}

export async function GET() {
  try {
    const topics = await getBlockedTopics();
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("GET news-blocked-topics failed", error);
    return NextResponse.json(
      { error: "Failed to load muted topics" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.seedDefaults === true) {
      const topics = await seedDefaultBlockedTopics();
      return NextResponse.json({ topics });
    }

    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label) {
      return NextResponse.json(
        { error: "Muted topic label is required" },
        { status: 400 },
      );
    }

    const topic = await createBlockedTopic({
      label,
      keywords: parseKeywords(body.keywords, label),
      enabled: body.enabled !== false,
    });

    return NextResponse.json({ topic });
  } catch (error) {
    console.error("POST news-blocked-topics failed", error);
    return NextResponse.json(
      { error: "Failed to save muted topic" },
      { status: 500 },
    );
  }
}
