import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { authErrorResponse, requireCurrentHousehold } from "@/lib/auth/household";
import { errorResponse } from "@/lib/api/errors";

interface NoteRequest {
  title?: string;
  content?: string;
  source_url?: string | null;
}

const noteSelect = "id,title,content,source_url,household_id,created_at,updated_at";

export async function GET() {
  try {
    const { householdId } = await requireCurrentHousehold();
    const { data, error } = await supabaseAdmin
      .from("notes")
      .select(noteSelect)
      .eq("household_id", householdId)
      .order("updated_at", { ascending: false });

    if (error) {
      return errorResponse(error.message, "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({ notes: data ?? [] });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to load notes";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as NoteRequest;
  const title = body.title?.trim();

  if (!title) {
    return errorResponse("title is required", "INVALID_INPUT", 400);
  }

  try {
    const { householdId } = await requireCurrentHousehold();
    const { data, error } = await supabaseAdmin
      .from("notes")
      .insert({
        household_id: householdId,
        title,
        content: body.content ?? "",
        source_url: body.source_url ?? null,
      })
      .select(noteSelect)
      .single();

    if (error) {
      return errorResponse(error.message, "INTERNAL_ERROR", 500);
    }

    return NextResponse.json({ note: data });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    const message = err instanceof Error ? err.message : "Failed to create note";
    return errorResponse(message, "INTERNAL_ERROR", 500);
  }
}
