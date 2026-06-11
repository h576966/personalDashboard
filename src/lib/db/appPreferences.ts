import { supabaseAdmin } from "@/lib/supabaseServer";
import { normalizeAppLanguage, type AppLanguage } from "@/lib/i18n";

export interface AppPreferences {
  id: string;
  app_language: AppLanguage;
  created_at?: string;
  updated_at?: string;
}

function normalizePreferences(value: Record<string, unknown>): AppPreferences {
  return {
    id: String(value.id),
    app_language: normalizeAppLanguage(value.app_language),
    created_at: typeof value.created_at === "string" ? value.created_at : undefined,
    updated_at: typeof value.updated_at === "string" ? value.updated_at : undefined,
  };
}

export async function getAppPreferences(): Promise<AppPreferences> {
  const { data, error } = await supabaseAdmin
    .from("briefing_preferences")
    .select("id,app_language,created_at,updated_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data) return normalizePreferences(data);

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("briefing_preferences")
    .insert({ app_language: "en" })
    .select("id,app_language,created_at,updated_at")
    .single();

  if (insertError) throw insertError;
  return normalizePreferences(inserted);
}

export async function updateAppPreferences(patch: {
  app_language?: AppLanguage;
}): Promise<AppPreferences> {
  const current = await getAppPreferences();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.app_language !== undefined) {
    update.app_language = normalizeAppLanguage(patch.app_language);
  }

  const { data, error } = await supabaseAdmin
    .from("briefing_preferences")
    .update(update)
    .eq("id", current.id)
    .select("id,app_language,created_at,updated_at")
    .single();

  if (error) throw error;
  return normalizePreferences(data);
}
