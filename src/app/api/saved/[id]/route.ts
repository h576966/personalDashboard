import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { authErrorResponse, requireCurrentHousehold } from "@/lib/auth/household";
import { errorResponse } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface UpdateSavedItemRequest {
  status?: string;
}

const savedItemSelect = "id,title,url,description,score,source,status,household_id,created_at";
const savedStatuses = new Set(["unread", "read", "archived"]);

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await req.json()) as UpdateSavedItemRequest;

  if (!id) {
    return errorResponse("Missing saved item id", "INVALID_INPUT", 400);
  }

  if (!body.status || !savedStatuses.has(body.status)) {
    return errorResponse("Invalid saved item status", "INVALID_INPUT", 400);
  }

  try {
    const { householdId } = await requireCurrentHousehold();
    const { data, error } = await supabaseAdmin
      .from("saved_items")
      .update({ status: body.status })
      .eq("id", id)
      .eq("household_id", householdId)
      .select(savedItemSelect)
      .single();

    if (error) {
      return errorResponse(error.message, "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to update saved item";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return errorResponse("Missing saved item id", "INVALID_INPUT", 400);
  }

  try {
    const { householdId } = await requireCurrentHousehold();
    const { error } = await supabaseAdmin
      .from("saved_items")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) {
      return errorResponse(error.message, "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to remove saved item";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}
