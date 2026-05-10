import { NextResponse } from "next/server";
import { authErrorResponse, requireCurrentHousehold } from "@/lib/auth/household";
import { errorResponse } from "@/lib/api/errors";
import {
  deleteList,
  getHouseholdListCount,
  getListItemCount,
  listExistsForHousehold,
  updateList,
} from "@/lib/db/lists";
import { getDeleteListRuleFailure } from "../deleteRules";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface UpdateListRequest {
  name?: string;
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await req.json()) as UpdateListRequest;
  const name = body.name?.trim();

  if (!id) {
    return errorResponse("Missing list id", "INVALID_INPUT", 400);
  }

  if (!name) {
    return errorResponse("name is required", "INVALID_INPUT", 400);
  }

  try {
    const { householdId } = await requireCurrentHousehold();
    const list = await updateList(id, householdId, { name });

    if (!list) {
      return errorResponse("List not found", "NOT_FOUND", 404);
    }

    return NextResponse.json({ list });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to update list";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return errorResponse("Missing list id", "INVALID_INPUT", 400);
  }

  try {
    const { householdId } = await requireCurrentHousehold();
    const listExists = await listExistsForHousehold(id, householdId);

    if (!listExists) {
      return errorResponse("List not found", "NOT_FOUND", 404);
    }

    const listCount = await getHouseholdListCount(householdId);
    const itemCount = await getListItemCount(id);
    const failure = getDeleteListRuleFailure({
      listExists,
      listCount,
      itemCount,
    });
    if (failure) {
      return errorResponse(failure.message, failure.code, failure.status);
    }

    const deleted = await deleteList(id, householdId);
    return NextResponse.json({ ok: deleted });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to delete list";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}
