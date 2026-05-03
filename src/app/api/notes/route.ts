import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

interface NoteRequest {
  title?: string;
  body?: string;
  source_url?: string | null;
}

const noteSelect = "id,title,body,source_url,created_at,updated_at";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("notes")
    .select(noteSelect)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(req: Request) {
  const body = (await req.json()) as NoteRequest;
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json(
      { error: { message: "title is required" } },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("notes")
    .insert({
      title,
      body: body.body ?? "",
      source_url: body.source_url ?? null,
    })
    .select(noteSelect)
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ note: data });
}
