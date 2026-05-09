import { supabaseAdmin } from "@/lib/supabaseServer";

export type NewsFeedbackVote = "up" | "down";

export class NewsFeedbackStorageNotReadyError extends Error {
  constructor(message = "News feedback storage is not ready") {
    super(message);
    this.name = "NewsFeedbackStorageNotReadyError";
  }
}

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

  if (error) {
    const message = String(error.message ?? "");
    const code = String(error.code ?? "");

    if (
      code === "42P01" ||
      message.includes("news_feedback") ||
      message.toLowerCase().includes("does not exist")
    ) {
      throw new NewsFeedbackStorageNotReadyError(
        "Apply migration 003_personal_news_feed.sql before feedback can sync.",
      );
    }

    throw error;
  }

  return rowToFeedback(data as Record<string, unknown>);
}

export async function getFeedbackAffinityByStory(): Promise<Map<string, number>> {
  const { data, error } = await supabaseAdmin
    .from("news_feedback")
    .select("story_id,vote");

  if (error) throw error;

  const totals = new Map<string, { up: number; down: number }>();

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const storyId = String(row.story_id ?? "");
    if (!storyId) continue;

    const current = totals.get(storyId) ?? { up: 0, down: 0 };
    if (row.vote === "down") {
      current.down += 1;
    } else {
      current.up += 1;
    }
    totals.set(storyId, current);
  }

  return new Map(
    [...totals.entries()].map(([storyId, total]) => {
      const votes = total.up + total.down;
      const raw = votes === 0 ? 0 : (total.up - total.down) / votes;
      return [storyId, Math.max(-1, Math.min(1, raw))];
    }),
  );
}
