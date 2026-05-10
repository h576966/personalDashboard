import { supabaseAdmin } from "@/lib/supabaseServer";

export type SavedNewsStatus = "unread" | "read" | "archived";

export interface NewsPersonalizationSignals {
  feedbackAffinityByStory: Map<string, number>;
  feedbackAffinityByInterest: Map<string, number>;
  savedUrlStatusByUrl: Map<string, SavedNewsStatus>;
  savedHostAffinityByHost: Map<string, number>;
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function clampAffinity(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export async function getNewsPersonalizationSignals(
  householdId: string,
): Promise<NewsPersonalizationSignals> {
  const [feedbackResult, savedResult, clustersResult] = await Promise.all([
    supabaseAdmin.from("news_feedback").select("story_id,vote"),
    supabaseAdmin
      .from("saved_items")
      .select("url,status")
      .eq("household_id", householdId)
      .eq("source", "news"),
    supabaseAdmin.from("news_story_clusters").select("id,matched_interests"),
  ]);

  if (feedbackResult.error) throw feedbackResult.error;
  if (savedResult.error) throw savedResult.error;
  if (clustersResult.error) throw clustersResult.error;

  // Build cluster lookup: story_id → normalized interest names
  const clusterMap = new Map<string, string[]>();
  for (const row of (clustersResult.data ?? []) as Array<Record<string, unknown>>) {
    const id = String(row.id ?? "");
    const interests = (row.matched_interests as unknown as string[]) ?? [];
    if (id && interests.length > 0) {
      clusterMap.set(id, interests.map((i) => i.toLowerCase()));
    }
  }

  const feedbackTotals = new Map<string, { up: number; down: number }>();

  for (const row of (feedbackResult.data ?? []) as Array<Record<string, unknown>>) {
    const storyId = String(row.story_id ?? "");
    if (!storyId) continue;

    const current = feedbackTotals.get(storyId) ?? { up: 0, down: 0 };
    if (row.vote === "down") {
      current.down += 1;
    } else {
      current.up += 1;
    }
    feedbackTotals.set(storyId, current);
  }

  const feedbackAffinityByStory = new Map(
    [...feedbackTotals.entries()].map(([storyId, total]) => {
      const votes = total.up + total.down;
      const raw = votes === 0 ? 0 : (total.up - total.down) / votes;
      return [storyId, clampAffinity(raw)];
    }),
  );

  // Per-interest affinity: join feedback with cluster matched_interests
  const interestTotals = new Map<string, { up: number; down: number }>();
  for (const row of (feedbackResult.data ?? []) as Array<Record<string, unknown>>) {
    const storyId = String(row.story_id ?? "");
    if (!storyId) continue;

    const matchedInterests = clusterMap.get(storyId);
    if (!matchedInterests) continue;

    for (const interest of matchedInterests) {
      const current = interestTotals.get(interest) ?? { up: 0, down: 0 };
      if (row.vote === "down") {
        current.down += 1;
      } else {
        current.up += 1;
      }
      interestTotals.set(interest, current);
    }
  }

  const feedbackAffinityByInterest = new Map(
    [...interestTotals.entries()].map(([interest, total]) => {
      const votes = total.up + total.down;
      const raw = votes === 0 ? 0 : (total.up - total.down) / votes;
      return [interest, clampAffinity(raw)];
    }),
  );

  const savedUrlStatusByUrl = new Map<string, SavedNewsStatus>();
  const hostTotals = new Map<string, number>();

  for (const row of (savedResult.data ?? []) as Array<Record<string, unknown>>) {
    const url = String(row.url ?? "");
    const status = row.status === "archived" ? "archived" : row.status === "read" ? "read" : "unread";
    if (!url) continue;

    savedUrlStatusByUrl.set(url, status);

    const host = hostFromUrl(url);
    if (!host) continue;

    const weight = status === "archived" ? -1 : status === "read" ? 0.6 : 1;
    hostTotals.set(host, (hostTotals.get(host) ?? 0) + weight);
  }

  const savedHostAffinityByHost = new Map(
    [...hostTotals.entries()].map(([host, total]) => [host, clampAffinity(total / 3)]),
  );

  return {
    feedbackAffinityByStory,
    feedbackAffinityByInterest,
    savedUrlStatusByUrl,
    savedHostAffinityByHost,
  };
}
