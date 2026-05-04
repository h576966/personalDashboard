import { supabaseAdmin } from "@/lib/supabaseServer";

export interface BriefingPreferences {
  id: string;
  blocked_categories: string[];
  blocked_keywords: string[];
  preferred_categories: string[];
  preferred_sources: string[];
  blocked_sources: string[];
  prefer_global_source_mix: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_PREFERENCES: Omit<BriefingPreferences, "id" | "created_at" | "updated_at"> = {
  blocked_categories: ["sports", "celebrities", "entertainment gossip"],
  blocked_keywords: [
    "celebrity",
    "celebrities",
    "hollywood",
    "reality tv",
    "football",
    "soccer",
    "nfl",
    "nba",
    "mlb",
    "nhl",
  ],
  preferred_categories: ["technology", "ai", "science", "geopolitics"],
  preferred_sources: [],
  blocked_sources: [],
  prefer_global_source_mix: true,
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizePreferences(value: Record<string, unknown>): BriefingPreferences {
  return {
    id: String(value.id),
    blocked_categories: asStringArray(value.blocked_categories),
    blocked_keywords: asStringArray(value.blocked_keywords),
    preferred_categories: asStringArray(value.preferred_categories),
    preferred_sources: asStringArray(value.preferred_sources),
    blocked_sources: asStringArray(value.blocked_sources),
    prefer_global_source_mix: Boolean(value.prefer_global_source_mix),
    created_at: typeof value.created_at === "string" ? value.created_at : undefined,
    updated_at: typeof value.updated_at === "string" ? value.updated_at : undefined,
  };
}

export async function getBriefingPreferences(): Promise<BriefingPreferences> {
  const { data, error } = await supabaseAdmin
    .from("briefing_preferences")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (data) return normalizePreferences(data);

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("briefing_preferences")
    .insert(DEFAULT_PREFERENCES)
    .select("*")
    .single();

  if (insertError) throw insertError;
  return normalizePreferences(inserted);
}

export async function updateBriefingPreferences(
  patch: Partial<Omit<BriefingPreferences, "id" | "created_at" | "updated_at">>,
): Promise<BriefingPreferences> {
  const current = await getBriefingPreferences();

  const { data, error } = await supabaseAdmin
    .from("briefing_preferences")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select("*")
    .single();

  if (error) throw error;
  return normalizePreferences(data);
}
