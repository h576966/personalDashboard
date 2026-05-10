import { supabaseAdmin } from "@/lib/supabaseServer";
import type { StoryBreakdownItem, StoryCard } from "@/lib/news/briefing";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asStoryBreakdown(value: unknown): StoryBreakdownItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
    )
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "",
      summary: typeof item.summary === "string" ? item.summary : "",
      sourceUrls: asStringArray(item.sourceUrls),
    }))
    .filter((item) => item.title || item.summary);
}

function rowToStoryCard(row: Record<string, unknown>): StoryCard {
  const items = Array.isArray(row.news_story_cluster_items)
    ? row.news_story_cluster_items
    : [];

  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    whyItMatters: String(row.why_it_matters ?? ""),
    score: Number(row.score ?? 0),
    sources: items.map((item) => {
      const source = item as Record<string, unknown>;
      return {
        title: String(source.title ?? ""),
        url: String(source.url ?? ""),
        description: String(source.description ?? ""),
        source: String(source.source ?? ""),
      };
    }),
    angles: asStringArray(row.angles),
    storyBreakdown: asStoryBreakdown(row.story_breakdown),
    imageUrl: String(row.image_url ?? ""),
    imageSource: String(row.image_source ?? ""),
    matchedInterests: asStringArray(row.matched_interests),
    isWatchUpdate: Boolean(row.is_watch_update),
    generatedAt: String(row.generated_at ?? ""),
  };
}

export async function upsertStoryCards(cards: StoryCard[]): Promise<void> {
  for (const card of cards) {
    const { error: clusterError } = await supabaseAdmin
      .from("news_story_clusters")
      .upsert({
        id: card.id,
        title: card.title,
        summary: card.summary,
        why_it_matters: card.whyItMatters,
        score: card.score,
        angles: card.angles,
        story_breakdown: card.storyBreakdown,
        image_url: card.imageUrl ?? "",
        image_source: card.imageSource ?? "",
        matched_interests: card.matchedInterests,
        is_watch_update: card.isWatchUpdate,
        generated_at: card.generatedAt,
      });

    if (clusterError) throw clusterError;

    const rows = card.sources.map((source) => ({
      cluster_id: card.id,
      url: source.url,
      title: source.title,
      description: source.description ?? "",
      source: source.source ?? "",
    }));

    if (rows.length > 0) {
      const { error: itemsError } = await supabaseAdmin
        .from("news_story_cluster_items")
        .upsert(rows, { onConflict: "cluster_id,url" });

      if (itemsError) throw itemsError;
    }
  }
}

export async function getTodaysStoryCards(): Promise<StoryCard[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  async function selectCards(includeRicherFields: boolean, includeAngles: boolean) {
    const clusterFields = [
      "id",
      "title",
      "summary",
      "why_it_matters",
      "score",
      ...(includeAngles ? ["angles"] : []),
      ...(includeRicherFields ? ["story_breakdown", "image_url", "image_source"] : []),
      "matched_interests",
      "is_watch_update",
      "generated_at",
    ].join(",");

    return supabaseAdmin
      .from("news_story_clusters")
      .select(`
      ${clusterFields},
      news_story_cluster_items (
        url,
        title,
        description,
        source,
        created_at
      )
    `)
      .gte("generated_at", startOfDay)
      .order("score", { ascending: false })
      .order("generated_at", { ascending: false })
      .limit(5);
  }

  let { data, error } = await selectCards(true, true);

  if (error) {
    const retry = await selectCards(false, true);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    const retry = await selectCards(false, false);
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(rowToStoryCard);
}
