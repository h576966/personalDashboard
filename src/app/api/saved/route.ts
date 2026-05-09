import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { authErrorResponse, requireCurrentHousehold } from "@/lib/auth/household";
import { errorResponse } from "@/lib/api/errors";

interface SaveItemRequest {
  title?: string;
  url?: string;
  description?: string;
  score?: number;
  source?: string;
}

const savedItemSelect = "id,title,url,description,score,source,status,household_id,created_at";

export async function GET() {
  try {
    const { householdId } = await requireCurrentHousehold();
    const { data, error } = await supabaseAdmin
      .from("saved_items")
      .select(savedItemSelect)
      .eq("household_id", householdId)
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse(error.message, "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to load saved items";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as SaveItemRequest;

  if (!body.title || !body.url) {
    return errorResponse("title and url are required", "INVALID_INPUT", 400);
  }

  try {
    const { householdId } = await requireCurrentHousehold();
    const { data, error } = await supabaseAdmin
      .from("saved_items")
      .upsert(
        {
          household_id: householdId,
          title: body.title,
          url: body.url,
          description: body.description ?? "",
          score: body.score ?? null,
          source: typeof body.source === "string" && body.source.trim() ? body.source.trim() : "search",
          status: "unread",
        },
        { onConflict: "url" },
      )
      .select(savedItemSelect)
      .single();

    if (error) {
      return errorResponse(error.message, "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to save item";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}
