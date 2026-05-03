import { getSupabase } from "./supabase";
import { assertField } from "./assert";

export interface NewsItemRow {
  id: string;
  title: string;
  url: string;
  canonicalUrl: string;
  titleHash: string;
  contentHash: string;
  description: string;
  source: string;
  score: number;
  firstSeenAt: string;
  lastSeenAt: string;
  status: string;
}

export interface BriefingItem {
  id: string;
  title: string;
  url: string;
  description: string;
  source: string;
  score: number;
  topicName: string;
  topicId: string;
  status: string;
  firstSeenAt: string;
}

export interface NewsRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  itemCount: number;
  error: string | null;
}

function rowToNewsItem(row: Record<string, unknown>): NewsItemRow {
  return {
    id: assertField<string>(row, "id", "string"),
    title: assertField<string>(row, "title", "string"),
    url: assertField<string>(row, "url", "string"),
    canonicalUrl: assertField<string>(row, "canonical_url", "string"),
    titleHash: assertField<string>(row, "title_hash", "string"),
    contentHash: assertField<string>(row, "content_hash", "string"),
    description: assertField<string>(row, "description", "string"),
    source: assertField<string>(row, "source", "string"),
    score: assertField<number>(row, "score", "number"),
    firstSeenAt: assertField<string>(row, "first_seen_at", "string"),
    lastSeenAt: assertField<string>(row, "last_seen_at", "string"),
    status: assertField<string>(row, "status", "string"),
  };
}

function rowToRun(row: Record<string, unknown>): NewsRun {
  return {
    id: assertField<string>(row, "id", "string"),
    startedAt: assertField<string>(row, "started_at", "string"),
    completedAt: (row.completed_at as string | null) ?? null,
    status: assertField<string>(row, "status", "string"),
    itemCount: assertField<number>(row, "item_count", "number"),
    error: (row.error as string | null) ?? null,
  };
}

export async function getSeenItemByUrl(url: string): Promise<NewsItemRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .eq("url", url)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToNewsItem(data as Record<string, unknown>) : null;
}

export async function getSeenItemByTitleHash(hash: string): Promise<NewsItemRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .eq("title_hash", hash)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToNewsItem(data as Record<string, unknown>) : null;
}

export async function insertNewsItem(item: {
  title: string;
  url: string;
  canonicalUrl?: string;
  titleHash?: string;
  contentHash?: string;
  description?: string;
  source?: string;
  score?: number;
}): Promise<NewsItemRow> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("news_items")
    .insert({
      title: item.title,
      url: item.url,
      canonical_url: item.canonicalUrl ?? "",
      title_hash: item.titleHash ?? "",
      content_hash: item.contentHash ?? "",
      description: item.description ?? "",
      source: item.source ?? "",
      score: item.score ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToNewsItem(data as Record<string, unknown>);
}

export async function updateNewsItemStatus(id: string, status: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("news_items")
    .update({ status, last_seen_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function updateItemLastSeen(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("news_items")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function getTodaysBriefing(): Promise<BriefingItem[]> {
  const supabase = getSupabase();
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).toISOString();

  const { data, error } = await supabase
    .from("news_items")
    .select(
      `
      id,
      title,
      url,
      description,
      source,
      score,
      first_seen_at,
      status,
      news_topic_items!inner (
        topic_id,
        score,
        news_topics!inner (name)
      )
    `,
    )
    .eq("status", "shown")
    .gte("first_seen_at", startOfDay)
    .order("first_seen_at", { ascending: false });

  if (error) throw error;

  return ((data as Array<Record<string, unknown>> | null) ?? []).flatMap(
    (item: Record<string, unknown>) => {
      const links = item.news_topic_items as Array<Record<string, unknown>>;
      return links.map((link: Record<string, unknown>) => {
        const topic = link.news_topics as Record<string, unknown>;
        return {
          id: item.id as string,
          title: item.title as string,
          url: item.url as string,
          description: item.description as string,
          source: item.source as string,
          score: (link.score as number) ?? (item.score as number),
          topicName: topic.name as string,
          topicId: link.topic_id as string,
          status: item.status as string,
          firstSeenAt: item.first_seen_at as string,
        };
      });
    },
  );
}

export async function createRun(): Promise<NewsRun> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("news_runs")
    .insert({ status: "running" })
    .select()
    .single();

  if (error) throw error;
  return rowToRun(data as Record<string, unknown>);
}

export async function getRunById(id: string): Promise<NewsRun | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("news_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToRun(data as Record<string, unknown>) : null;
}

export async function markRunComplete(
  id: string,
  itemCount: number,
  error?: string,
): Promise<void> {
  const supabase = getSupabase();
  const update: Record<string, unknown> = {
    completed_at: new Date().toISOString(),
    item_count: itemCount,
  };

  if (error) {
    update.status = "error";
    update.error = error;
  } else {
    update.status = "completed";
  }

  const { error: updateError } = await supabase
    .from("news_runs")
    .update(update)
    .eq("id", id);

  if (updateError) throw updateError;
}

export async function linkItemToTopic(
  itemId: string,
  topicId: string,
  score: number,
  runId?: string,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("news_topic_items")
    .upsert(
      {
        topic_id: topicId,
        item_id: itemId,
        score,
        run_id: runId ?? null,
      },
      { onConflict: "topic_id,item_id", ignoreDuplicates: true },
    );

  // If ignoreDuplicates is not supported, fall back to
  // ignoring duplicate key violations
  if (error && !String(error.message ?? "").includes("duplicate key")) {
    throw error;
  }
}
