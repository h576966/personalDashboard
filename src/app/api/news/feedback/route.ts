import { NextResponse } from "next/server";
import {
  createNewsFeedback,
  NewsFeedbackStorageNotReadyError,
  type NewsFeedbackVote,
} from "@/lib/db/newsFeedback";
import { errorResponse } from "@/lib/api/errors";
import { authErrorResponse, requireCurrentHousehold } from "@/lib/auth/household";

const VALID_VOTES = new Set<NewsFeedbackVote>(["up", "down"]);

export async function POST(req: Request) {
  try {
    await requireCurrentHousehold();
    const body = await req.json();
    const storyId = typeof body.storyId === "string" ? body.storyId.trim() : "";
    const vote = body.vote as NewsFeedbackVote;

    if (!storyId) {
      return errorResponse("storyId is required", "INVALID_INPUT", 400);
    }

    if (!VALID_VOTES.has(vote)) {
      return errorResponse("vote must be up or down", "INVALID_INPUT", 400);
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
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof NewsFeedbackStorageNotReadyError) {
      return errorResponse(error.message, "FEEDBACK_STORAGE_NOT_READY", 503);
    }

    console.error("POST news feedback failed", error);
    return errorResponse("Failed to save feedback", "INTERNAL_ERROR", 500);
  }
}
