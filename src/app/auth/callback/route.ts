import { NextResponse, type NextRequest } from "next/server";
import { ensureHouseholdMember, AuthError } from "@/lib/auth/household";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/?auth=error", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/?auth=error", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/?auth=error", request.url));
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

  return NextResponse.redirect(new URL(next, request.url));
}
