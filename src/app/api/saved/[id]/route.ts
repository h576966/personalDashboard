import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { errorResponse } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return errorResponse("Missing saved item id", "INVALID_INPUT", 400);
  }

  const { error } = await supabaseAdmin
    .from("saved_items")
    .delete()
    .eq("id", id);

  if (error) {
    return errorResponse(error.message, "INTERNAL_ERROR", 500);
  }

  return NextResponse.json({ ok: true });
}
