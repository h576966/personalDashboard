import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: { message: "Missing saved item id" } },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("saved_items")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
