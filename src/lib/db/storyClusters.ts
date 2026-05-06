import { supabaseAdmin } from "@/lib/supabaseServer";
import type { StoryCard } from "@/lib/news/briefing";

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
