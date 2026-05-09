import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { errorResponse } from "@/lib/api/errors";
import { getDefaultHouseholdId } from "@/lib/db/households";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await req.json();

  try {
    const householdId = await getDefaultHouseholdId();
    const { data, error } = await supabaseAdmin
      .from("notes")
      .update({
        title: body.title,
        content: body.content,
      })
      .eq("id", id)
      .eq("household_id", householdId)
      .select("id,title,content,source_url,household_id,created_at,updated_at")
      .single();

    if (error) {
      return errorResponse(error.message, "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({ note: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update note";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const householdId = await getDefaultHouseholdId();
    const { error } = await supabaseAdmin
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) {
      return errorResponse(error.message, "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete note";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}
