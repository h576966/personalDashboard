import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/auth/allowlist";

function jsonError(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return jsonError("Auth is not configured", "AUTH_NOT_CONFIGURED", 500);
    }

    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!user?.email) {
      return jsonError("Authentication required", "UNAUTHENTICATED", 401);
    }

    if (!isEmailAllowed(user.email)) {
      return jsonError("This email is not allowed for this household", "FORBIDDEN", 403);
    }
  }

  return response;
}
