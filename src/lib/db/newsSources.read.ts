import { supabaseAdmin } from "@/lib/supabaseServer";
import { rowToNewsSource, type NewsSource } from "./newsSources.shared";

export async function getNewsSources(): Promise<NewsSource[]> {
  const { data, error } = await supabaseAdmin
    .from("news_sources")
    .select("*")
    .order("region", { ascending: true })
    .order("quality_score", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToNewsSource(row as Record<string, unknown>));
}

export async function getEnabledNewsSources(): Promise<NewsSource[]> {
  const { data, error } = await supabaseAdmin
    .from("news_sources")
    .select("*")
    .eq("default_enabled", true)
    .eq("user_enabled", true)
    .order("region", { ascending: true })
    .order("quality_score", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToNewsSource(row as Record<string, unknown>));
}

