import type { User } from "@supabase/supabase-js";
import { errorResponse } from "@/lib/api/errors";
import { isEmailAllowed, normalizedEmail } from "@/lib/auth/allowlist";
import { getDefaultHouseholdId } from "@/lib/db/households";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface CurrentHousehold {
  householdId: string;
  email: string;
  user: User;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly email?: string,
  ) {
    super(message);
  }
}

export function authErrorResponse(error: unknown) {
  if (!(error instanceof AuthError)) return null;
  return errorResponse(error.message, error.code, error.status);
}

export async function ensureHouseholdMember(user: User): Promise<CurrentHousehold> {
  const email = user.email ? normalizedEmail(user.email) : "";

  if (!email) {
    throw new AuthError("Authentication required", "UNAUTHENTICATED", 401);
  }

  if (!isEmailAllowed(email)) {
    throw new AuthError("This email is not allowed for this household", "FORBIDDEN", 403, email);
  }

  const householdId = await getDefaultHouseholdId();
  const displayName =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
      ? user.user_metadata.name.trim()
      : email;

  const { error } = await supabaseAdmin.from("household_members").upsert(
    {
      household_id: householdId,
      email,
      display_name: displayName,
      role: "member",
    },
    { onConflict: "household_id,email" },
  );

  if (error) throw error;

  return { householdId, email, user };
}

export async function requireCurrentHousehold(): Promise<CurrentHousehold> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Authentication required", "UNAUTHENTICATED", 401);
  }

  return ensureHouseholdMember(user);
}

export async function getCurrentHousehold(): Promise<CurrentHousehold | null> {
  try {
    return await requireCurrentHousehold();
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) {
      return null;
    }

    throw error;
  }
}
