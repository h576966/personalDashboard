import { NextResponse } from "next/server";
import { createTopic, getTopics } from "@/lib/db/topics";

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];

  return value
    .split("\n")
    .flatMap((line) => line.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET() {
  try {
    const topics = await getTopics();
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("GET topics failed", error);
    return NextResponse.json(
      { error: "Failed to load topics" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const queries = parseList(body.queries).length > 0 ? parseList(body.queries) : [name];

    if (!name) {
      return NextResponse.json(
        { error: "Topic name is required" },
        { status: 400 },
      );
    }

    const topic = await createTopic({
      name,
      description: typeof body.description === "string" ? body.description : "",
      queries,
      country: typeof body.country === "string" ? body.country : "",
      region: typeof body.region === "string" ? body.region : "",
      language: typeof body.language === "string" ? body.language : "",
      preferredSources: parseList(body.preferredSources),
      blockedSources: parseList(body.blockedSources),
      requiredKeywords: parseList(body.requiredKeywords),
      blockedKeywords: parseList(body.blockedKeywords),
      enabled: body.enabled !== false,
    });

    return NextResponse.json({ topic });
  } catch (error) {
    console.error("POST topics failed", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 },
    );
  }
}
