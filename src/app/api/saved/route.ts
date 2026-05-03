import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

interface SaveItemRequest {
  title?: string;
  url?: string;
  description?: string;
  score?: number;
}

const savedItemSelect = "id,title,url,description,score,source,created_at";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("saved_items")
    .select(savedItemSelect)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const body = (await req.json()) as SaveItemRequest;

  if (!body.title || !body.url) {
    return NextResponse.json(
      { error: { message: "title and url are required" } },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("saved_items")
    .upsert(
      {
        title: body.title,
        url: body.url,
        description: body.description ?? "",
        score: body.score ?? null,
        source: "search",
      },
      { onConflict: "url" },
    )
    .select(savedItemSelect)
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ item: data });
}
