import { NextResponse } from "next/server";
import { authErrorResponse, requireCurrentHousehold } from "@/lib/auth/household";
import { errorResponse } from "@/lib/api/errors";
import { createListItem } from "@/lib/db/lists";
import { supabaseAdmin } from "@/lib/supabaseServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface CreateListItemRequest {
  label?: string;
}

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await req.json()) as CreateListItemRequest;
  const label = body.label?.trim();

  if (!id) {
    return errorResponse("Missing list id", "INVALID_INPUT", 400);
  }

  if (!label) {
    return errorResponse("label is required", "INVALID_INPUT", 400);
  }

  try {
    const { householdId } = await requireCurrentHousehold();
    const { data: list, error: listError } = await supabaseAdmin
      .from("lists")
      .select("id")
      .eq("id", id)
      .eq("household_id", householdId)
      .maybeSingle();

    if (listError) {
      return errorResponse(listError.message, "INTERNAL_ERROR", 500);
    }

    if (!list) {
      return errorResponse("List not found", "NOT_FOUND", 404);
    }

    const item = await createListItem(id, label);
    return NextResponse.json({ item });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to create list item";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}
