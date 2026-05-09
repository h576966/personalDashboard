import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errors";
import { getDefaultHouseholdId } from "@/lib/db/households";
import { createList, getListsWithItems } from "@/lib/db/lists";

interface CreateListRequest {
  name?: string;
}

export async function GET() {
  try {
    const householdId = await getDefaultHouseholdId();
    const lists = await getListsWithItems(householdId);

    return NextResponse.json({ lists });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load lists";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as CreateListRequest;
  const name = body.name?.trim();

  if (!name) {
    return errorResponse("name is required", "INVALID_INPUT", 400);
  }

  try {
    const householdId = await getDefaultHouseholdId();
    const list = await createList(householdId, name);

    return NextResponse.json({ list });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create list";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}
