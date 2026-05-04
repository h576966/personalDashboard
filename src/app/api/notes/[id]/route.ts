import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("notes")
    .update({
      title: body.title,
      content: body.content,
    })
    .eq("id", id)
    .select("id,title,content,source_url,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ note: data });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  const { error } = await supabaseAdmin
    .from("notes")
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
