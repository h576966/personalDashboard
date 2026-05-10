import { supabaseAdmin } from "@/lib/supabaseServer";
import { DEFAULT_SOURCES, rowToNewsSource, type NewsSource, type UpdateNewsSourceData } from "./newsSources.shared";
import { getNewsSources } from "./newsSources.read";

export async function seedDefaultNewsSources(): Promise<NewsSource[]> {
  const existing = await getNewsSources();
  const byDomain = new Map(existing.map((source) => [source.domain, source]));

  for (const source of DEFAULT_SOURCES) {
    const current = byDomain.get(source.domain);

    if (!current) {
      const { error } = await supabaseAdmin.from("news_sources").insert({
        name: source.name,
        domain: source.domain,
        region: source.region,
        language: source.language,
        tags: source.tags,
        quality_score: source.qualityScore,
        default_enabled: source.defaultEnabled,
        user_enabled: source.defaultEnabled,
      });
      if (error) throw error;
      continue;
    }

    const { error } = await supabaseAdmin
      .from("news_sources")
      .update({
        name: source.name,
        region: source.region,
        language: source.language,
        tags: source.tags,
        quality_score: source.qualityScore,
        default_enabled: source.defaultEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);

    if (error) throw error;
  }

  return getNewsSources();
}

export async function updateNewsSource(
  id: string,
  data: UpdateNewsSourceData,
): Promise<NewsSource> {
  const update: Record<string, unknown> = {};

  if (data.enabled !== undefined) update.user_enabled = data.enabled;
  if (data.priority !== undefined) update.quality_score = data.priority / 100;

  if (Object.keys(update).length === 0) {
    const source = (await getNewsSources()).find((item) => item.id === id);
    if (!source) throw new Error(`News source with id ${id} not found`);
    return source;
  }

  update.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabaseAdmin
    .from("news_sources")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return rowToNewsSource(updated as Record<string, unknown>);
}

