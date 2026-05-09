import { supabaseAdmin } from "@/lib/supabaseServer";

export interface WatchTopic {
  id: string;
  name: string;
  queries: string[];
  sourceDomains: string[];
  lastSeenHash: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWatchTopicData {
  name: string;
  queries: string[];
  sourceDomains?: string[];
  enabled?: boolean;
}

export interface UpdateWatchTopicData {
  name?: string;
  queries?: string[];
  sourceDomains?: string[];
  enabled?: boolean;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function rowToWatchTopic(row: Record<string, unknown>): WatchTopic {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    queries: asStringArray(row.queries),
    sourceDomains: asStringArray(row.source_domains),
    lastSeenHash: String(row.last_seen_hash ?? ""),
    enabled: Boolean(row.enabled),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function getEnabledWatchTopics(): Promise<WatchTopic[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("news_watch_topics")
      .select("*")
      .eq("enabled", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => rowToWatchTopic(row as Record<string, unknown>));
  } catch (err) {
    console.warn("Failed to load watch topics; skipping watch scan:", err);
    return [];
  }
}

export async function getWatchTopics(): Promise<WatchTopic[]> {
  const { data, error } = await supabaseAdmin
    .from("news_watch_topics")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToWatchTopic(row as Record<string, unknown>));
}

export async function createWatchTopic(data: CreateWatchTopicData): Promise<WatchTopic> {
  const name = data.name.trim();
  const queries = data.queries.map((query) => query.trim()).filter(Boolean);
  const sourceDomains = (data.sourceDomains ?? []).map((domain) => domain.trim()).filter(Boolean);

  if (!name) throw new Error("Watch topic name is required");
  if (queries.length === 0) throw new Error("At least one query is required");

  const { data: inserted, error } = await supabaseAdmin
    .from("news_watch_topics")
    .insert({
      name,
      queries,
      source_domains: sourceDomains,
      enabled: data.enabled !== false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return rowToWatchTopic(inserted as Record<string, unknown>);
}

export async function updateWatchTopic(
  id: string,
  data: UpdateWatchTopicData,
): Promise<WatchTopic> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.name !== undefined) update.name = data.name.trim();
  if (data.queries !== undefined) {
    update.queries = data.queries.map((query) => query.trim()).filter(Boolean);
  }
  if (data.sourceDomains !== undefined) {
    update.source_domains = data.sourceDomains.map((domain) => domain.trim()).filter(Boolean);
  }
  if (data.enabled !== undefined) update.enabled = data.enabled;

  const { data: updated, error } = await supabaseAdmin
    .from("news_watch_topics")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return rowToWatchTopic(updated as Record<string, unknown>);
}

export async function deleteWatchTopic(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("news_watch_topics")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function updateWatchTopicLastSeen(id: string, hash: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("news_watch_topics")
    .update({ last_seen_hash: hash, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
