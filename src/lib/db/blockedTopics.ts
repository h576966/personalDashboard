import { supabaseAdmin } from "@/lib/supabaseServer";

export interface BlockedTopic {
  id: string;
  label: string;
  keywords: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlockedTopicData {
  label: string;
  keywords: string[];
  enabled?: boolean;
}

export const DEFAULT_BLOCKED_TOPICS: CreateBlockedTopicData[] = [
  {
    label: "Sports",
    keywords: ["sports", "football", "soccer", "nfl", "nba", "mlb", "nhl"],
  },
  {
    label: "Celebrities",
    keywords: ["celebrity", "celebrities", "hollywood", "reality tv"],
  },
  {
    label: "Gossip",
    keywords: ["gossip", "tabloid", "rumor", "rumours"],
  },
  {
    label: "Entertainment",
    keywords: ["entertainment", "movie star", "pop star", "box office"],
  },
];

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function rowToBlockedTopic(row: Record<string, unknown>): BlockedTopic {
  return {
    id: String(row.id),
    label: String(row.label ?? ""),
    keywords: asStringArray(row.keywords),
    enabled: Boolean(row.enabled),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function seedDefaultBlockedTopics(): Promise<BlockedTopic[]> {
  for (const topic of DEFAULT_BLOCKED_TOPICS) {
    const { error } = await supabaseAdmin
      .from("news_blocked_topics")
      .upsert(
        {
          label: topic.label,
          keywords: topic.keywords,
          enabled: topic.enabled !== false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "label" },
      );

    if (error) throw error;
  }

  return getBlockedTopics();
}

export async function getBlockedTopics(): Promise<BlockedTopic[]> {
  const { data, error } = await supabaseAdmin
    .from("news_blocked_topics")
    .select("*")
    .order("label", { ascending: true });

  if (error) throw error;

  if (!data || data.length === 0) {
    return seedDefaultBlockedTopics();
  }

  return data.map((row) => rowToBlockedTopic(row as Record<string, unknown>));
}

export async function getEnabledBlockedKeywords(): Promise<string[]> {
  try {
    const topics = await getBlockedTopics();
    return topics
      .filter((topic) => topic.enabled)
      .flatMap((topic) => topic.keywords);
  } catch (err) {
    console.warn("Failed to load muted topics; using built-in defaults:", err);
    return DEFAULT_BLOCKED_TOPICS.flatMap((topic) => topic.keywords);
  }
}

export async function createBlockedTopic(data: CreateBlockedTopicData): Promise<BlockedTopic> {
  const label = data.label.trim();
  if (!label) throw new Error("Muted topic label is required");

  const { data: inserted, error } = await supabaseAdmin
    .from("news_blocked_topics")
    .insert({
      label,
      keywords: data.keywords,
      enabled: data.enabled !== false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return rowToBlockedTopic(inserted as Record<string, unknown>);
}

export async function updateBlockedTopic(
  id: string,
  data: Partial<Pick<BlockedTopic, "enabled" | "keywords" | "label">>,
): Promise<BlockedTopic> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.enabled !== undefined) update.enabled = data.enabled;
  if (data.keywords !== undefined) update.keywords = data.keywords;
  if (data.label !== undefined) update.label = data.label.trim();

  const { data: updated, error } = await supabaseAdmin
    .from("news_blocked_topics")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return rowToBlockedTopic(updated as Record<string, unknown>);
}
