import { supabaseAdmin } from "@/lib/supabaseServer";

export type NewsFeedbackVote = "up" | "down";

export interface NewsFeedback {
  id: string;
  storyId: string;
  newsItemId: string | null;
  vote: NewsFeedbackVote;
  reasonTags: string[];
  createdAt: string;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function rowToFeedback(row: Record<string, unknown>): NewsFeedback {
  return {
    id: String(row.id),
    storyId: String(row.story_id ?? ""),
    newsItemId: typeof row.news_item_id === "string" ? row.news_item_id : null,
    vote: row.vote === "down" ? "down" : "up",
    reasonTags: asStringArray(row.reason_tags),
    createdAt: String(row.created_at ?? ""),
  };
}

export async function createNewsFeedback(input: {
  storyId: string;
  newsItemId?: string | null;
  vote: NewsFeedbackVote;
  reasonTags?: string[];
}): Promise<NewsFeedback> {
  const { data, error } = await supabaseAdmin
    .from("news_feedback")
    .insert({
      story_id: input.storyId,
      news_item_id: input.newsItemId ?? null,
      vote: input.vote,
      reason_tags: input.reasonTags ?? [],
    })
    .select("*")
    .single();

  if (error) throw error;
  return rowToFeedback(data as Record<string, unknown>);
}
