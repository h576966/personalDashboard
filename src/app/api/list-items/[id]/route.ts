import { NextResponse } from "next/server";
import { authErrorResponse, requireCurrentHousehold } from "@/lib/auth/household";
import { errorResponse } from "@/lib/api/errors";
import { deleteListItem, updateListItem } from "@/lib/db/lists";
import { supabaseAdmin } from "@/lib/supabaseServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface UpdateListItemRequest {
  label?: string;
  is_completed?: boolean;
}

async function listItemBelongsToHousehold(id: string, householdId: string): Promise<boolean> {
  const { data: item, error: itemError } = await supabaseAdmin
    .from("list_items")
    .select("list_id")
    .eq("id", id)
    .maybeSingle();

  if (itemError) throw itemError;
  if (!item?.list_id) return false;

  const { data: list, error: listError } = await supabaseAdmin
    .from("lists")
    .select("id")
    .eq("id", item.list_id)
    .eq("household_id", householdId)
    .maybeSingle();

  if (listError) throw listError;
  return Boolean(list);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await req.json()) as UpdateListItemRequest;

  if (!id) {
    return errorResponse("Missing list item id", "INVALID_INPUT", 400);
  }

  if (body.label !== undefined && !body.label.trim()) {
    return errorResponse("label cannot be empty", "INVALID_INPUT", 400);
  }

  try {
    const { householdId } = await requireCurrentHousehold();
    const isScopedItem = await listItemBelongsToHousehold(id, householdId);
    if (!isScopedItem) {
      return errorResponse("List item not found", "NOT_FOUND", 404);
    }

    const item = await updateListItem(id, {
      label: body.label?.trim(),
      is_completed: body.is_completed,
    });

    return NextResponse.json({ item });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to update list item";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return errorResponse("Missing list item id", "INVALID_INPUT", 400);
  }

  try {
    const { householdId } = await requireCurrentHousehold();
    const isScopedItem = await listItemBelongsToHousehold(id, householdId);
    if (!isScopedItem) {
      return errorResponse("List item not found", "NOT_FOUND", 404);
    }

    await deleteListItem(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to delete list item";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}
