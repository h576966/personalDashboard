import { supabaseAdmin } from "@/lib/supabaseServer";

export const DEFAULT_HOUSEHOLD_NAME = "Home";

export async function getDefaultHouseholdId(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("households")
    .select("id")
    .eq("name", DEFAULT_HOUSEHOLD_NAME)
    .maybeSingle();

  if (error) throw error;
  if (data?.id) return data.id as string;

  const { data: created, error: createError } = await supabaseAdmin
    .from("households")
    .insert({ name: DEFAULT_HOUSEHOLD_NAME })
    .select("id")
    .single();

  if (createError) throw createError;
  return created.id as string;
}
