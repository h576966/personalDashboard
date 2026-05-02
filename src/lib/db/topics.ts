import { getSupabase } from "./supabase";

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
      max_items_per_day: data.maxItemsPerDay ?? 10,
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
