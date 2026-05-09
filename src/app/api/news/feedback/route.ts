import { NextResponse } from "next/server";
import {
  createNewsFeedback,
  NewsFeedbackStorageNotReadyError,
  type NewsFeedbackVote,
} from "@/lib/db/newsFeedback";

const VALID_VOTES = new Set<NewsFeedbackVote>(["up", "down"]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const storyId = typeof body.storyId === "string" ? body.storyId.trim() : "";
    const vote = body.vote as NewsFeedbackVote;

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 },
      );
    }

    if (!VALID_VOTES.has(vote)) {
      return NextResponse.json(
        { error: "vote must be up or down" },
        { status: 400 },
      );
    }

    const feedback = await createNewsFeedback({
      storyId,
      vote,
      reasonTags: Array.isArray(body.reasonTags)
        ? body.reasonTags.filter((item: unknown): item is string => typeof item === "string")
        : [],
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    if (error instanceof NewsFeedbackStorageNotReadyError) {
      return NextResponse.json(
        { error: error.message, code: "FEEDBACK_STORAGE_NOT_READY" },
        { status: 503 },
      );
    }

    console.error("POST news feedback failed", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 },
    );
  }
}
