import { NextRequest, NextResponse } from "next/server";
import { updateNewsItemStatus } from "@/lib/db/newsItems";

interface ErrorResponse {
  error: { message: string; code: string };
}

function errorResponse(
  message: string,
  code: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: { message, code } }, { status });
}

const VALID_STATUSES = new Set(["dismissed", "saved", "hidden"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idStr } = await params;
    if (!idStr || idStr.length < 32) {
      return errorResponse("Invalid item id", "INVALID_INPUT", 400);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", "INVALID_JSON", 400);
    }

    if (typeof body !== "object" || body === null) {
      return errorResponse("Request body must be a JSON object", "INVALID_INPUT", 400);
    }

    const { status } = body as { status?: string };

    if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
      return errorResponse(
        `status must be one of: ${[...VALID_STATUSES].join(", ")}`,
        "INVALID_INPUT",
        400,
      );
    }

    await updateNewsItemStatus(idStr, status);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update item status:", err);
    return errorResponse("Failed to update item status", "INTERNAL_ERROR", 500);
  }
}
