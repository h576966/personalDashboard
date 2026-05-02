import { getSupabase } from "./supabase";

// ── UI Constants ────────────────────────────────────────────────

export interface LanguageOption {
  value: string;
  label: string;
}

export interface CountryOption {
  value: string;
  label: string;
}

export interface TopicPreset {
  label: string;
  queries: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "", label: "Any" },
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "ru", label: "Russian" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "sv", label: "Swedish" },
  { value: "no", label: "Norwegian" },
  { value: "da", label: "Danish" },
  { value: "fi", label: "Finnish" },
  { value: "pl", label: "Polish" },
  { value: "cs", label: "Czech" },
  { value: "hu", label: "Hungarian" },
  { value: "ro", label: "Romanian" },
  { value: "el", label: "Greek" },
  { value: "tr", label: "Turkish" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
  { value: "hi", label: "Hindi" },
];

export const COUNTRY_OPTIONS: CountryOption[] = [
  { value: "", label: "Any" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "PT", label: "Portugal" },
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "CH", label: "Switzerland" },
  { value: "AT", label: "Austria" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "PL", label: "Poland" },
  { value: "CZ", label: "Czech Republic" },
  { value: "HU", label: "Hungary" },
  { value: "RO", label: "Romania" },
  { value: "GR", label: "Greece" },
  { value: "TR", label: "Turkey" },
  { value: "RU", label: "Russia" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "KR", label: "South Korea" },
  { value: "IN", label: "India" },
  { value: "BR", label: "Brazil" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "Mexico" },
  { value: "ZA", label: "South Africa" },
  { value: "NG", label: "Nigeria" },
  { value: "EG", label: "Egypt" },
  { value: "IL", label: "Israel" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SG", label: "Singapore" },
  { value: "HK", label: "Hong Kong" },
  { value: "TW", label: "Taiwan" },
];

export const TOPIC_PRESETS: TopicPreset[] = [
  { label: "Custom", queries: "" },
  { label: "Technology", queries: "technology news\nAI\ncybersecurity" },
  { label: "World News", queries: "world news\ninternational affairs\nglobal politics" },
  { label: "Sports", queries: "sports news\nscores\nathletics" },
  { label: "Science", queries: "science news\nresearch discoveries\nspace" },
  { label: "Business", queries: "business news\nfinancial markets\neconomy" },
];

// ── Types ───────────────────────────────────────────────────────

export interface NewsTopic {
  id: string;
  name: string;
  description: string;
  queries: string[];
  country: string;
  region: string;
  language: string;
  preferredSources: string[];
  blockedSources: string[];
  requiredKeywords: string[];
  blockedKeywords: string[];
  maxItemsPerDay: number;
  minScore: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicData {
  name: string;
  description?: string;
  queries: string[];
  country?: string;
  region?: string;
  language?: string;
  preferredSources?: string[];
  blockedSources?: string[];
  requiredKeywords?: string[];
  blockedKeywords?: string[];
  maxItemsPerDay?: number;
  minScore?: number;
  enabled?: boolean;
}

export interface UpdateTopicData {
  name?: string;
  description?: string;
  queries?: string[];
  country?: string;
  region?: string;
  language?: string;
  preferredSources?: string[];
  blockedSources?: string[];
  requiredKeywords?: string[];
  blockedKeywords?: string[];
  maxItemsPerDay?: number;
  minScore?: number;
  enabled?: boolean;
}

function rowToTopic(row: Record<string, unknown>): NewsTopic {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    queries: row.queries as string[],
    country: row.country as string,
    region: row.region as string,
    language: row.language as string,
    preferredSources: row.preferred_sources as string[],
    blockedSources: row.blocked_sources as string[],
    requiredKeywords: row.required_keywords as string[],
    blockedKeywords: row.blocked_keywords as string[],
    maxItemsPerDay: row.max_items_per_day as number,
    minScore: row.min_score as number,
    enabled: row.enabled as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getTopics(): Promise<NewsTopic[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("news_topics")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToTopic(row as Record<string, unknown>));
}

export async function getTopic(id: string): Promise<NewsTopic | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("news_topics")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToTopic(data as Record<string, unknown>) : null;
}

export async function createTopic(data: CreateTopicData): Promise<NewsTopic> {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Topic name is required");
  }
  if (!data.queries || data.queries.length === 0) {
    throw new Error("At least one query is required");
  }

  const supabase = getSupabase();
  const { error: insertError, data: inserted } = await supabase
    .from("news_topics")
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() ?? "",
      queries: data.queries,
      country: data.country ?? "",
      region: data.region ?? "",
      language: data.language ?? "",
      preferred_sources: data.preferredSources ?? [],
      blocked_sources: data.blockedSources ?? [],
      required_keywords: data.requiredKeywords ?? [],
      blocked_keywords: data.blockedKeywords ?? [],
      max_items_per_day: data.maxItemsPerDay ?? 5,
      min_score: data.minScore ?? 0,
      enabled: data.enabled !== false,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return rowToTopic(inserted as Record<string, unknown>);
}

export async function updateTopic(
  id: string,
  data: UpdateTopicData,
): Promise<NewsTopic> {
  const existing = await getTopic(id);
  if (!existing) {
    throw new Error(`Topic with id ${id} not found`);
  }

  const update: Record<string, unknown> = {};

  if (data.name !== undefined) {
    update.name = data.name.trim();
  }
  if (data.description !== undefined) {
    update.description = data.description.trim();
  }
  if (data.queries !== undefined) {
    update.queries = data.queries;
  }
  if (data.country !== undefined) {
    update.country = data.country;
  }
  if (data.region !== undefined) {
    update.region = data.region;
  }
  if (data.language !== undefined) {
    update.language = data.language;
  }
  if (data.preferredSources !== undefined) {
    update.preferred_sources = data.preferredSources;
  }
  if (data.blockedSources !== undefined) {
    update.blocked_sources = data.blockedSources;
  }
  if (data.requiredKeywords !== undefined) {
    update.required_keywords = data.requiredKeywords;
  }
  if (data.blockedKeywords !== undefined) {
    update.blocked_keywords = data.blockedKeywords;
  }
  if (data.maxItemsPerDay !== undefined) {
    update.max_items_per_day = data.maxItemsPerDay;
  }
  if (data.minScore !== undefined) {
    update.min_score = data.minScore;
  }
  if (data.enabled !== undefined) {
    update.enabled = data.enabled;
  }

  if (Object.keys(update).length === 0) {
    return existing;
  }

  update.updated_at = new Date().toISOString();

  const supabase = getSupabase();
  const { error: updateError } = await supabase
    .from("news_topics")
    .update(update)
    .eq("id", id);

  if (updateError) throw updateError;

  const updated = await getTopic(id);
  if (!updated) throw new Error("Failed to retrieve updated topic");
  return updated;
}

export async function deleteTopic(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error, count } = await supabase
    .from("news_topics")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw error;
  if (count === 0) {
    throw new Error(`Topic with id ${id} not found`);
  }
}
