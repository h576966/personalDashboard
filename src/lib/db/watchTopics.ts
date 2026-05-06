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

export async function updateWatchTopicLastSeen(id: string, hash: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("news_watch_topics")
    .update({ last_seen_hash: hash, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
