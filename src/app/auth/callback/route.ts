import { NextResponse, type NextRequest } from "next/server";
import { ensureHouseholdMember, AuthError } from "@/lib/auth/household";
import { createClient } from "@/lib/supabase/server";

function safeRedirectUrl(next: string | null, requestUrl: string): URL {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return new URL("/", requestUrl);
  }

  return new URL(next, requestUrl);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/?auth=missing_code", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/?auth=exchange_failed", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/?auth=session_missing", request.url));
  }

  try {
    await ensureHouseholdMember(user);
  } catch (err) {
    if (err instanceof AuthError && err.status === 403) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/?auth=denied", request.url));
    }

    throw err;
  }

  return NextResponse.redirect(safeRedirectUrl(next, request.url));
}
