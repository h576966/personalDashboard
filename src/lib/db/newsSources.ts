import { getSupabase } from "./supabase";

export interface NewsSource {
  id: string;
  name: string;
  domain: string;
  region: string;
  language: string;
  tags: string[];
  qualityScore: number;
  defaultEnabled: boolean;
  userEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateNewsSourceData {
  userEnabled?: boolean;
  qualityScore?: number;
  tags?: string[];
}

const DEFAULT_SOURCES: Array<Omit<NewsSource, "id" | "createdAt" | "updatedAt">> = [
  {
    name: "Reuters",
    domain: "reuters.com",
    region: "global",
    language: "en",
    tags: ["global", "general", "politics", "finance", "technology", "markets"],
    qualityScore: 0.96,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Associated Press",
    domain: "apnews.com",
    region: "global",
    language: "en",
    tags: ["global", "general", "politics", "world"],
    qualityScore: 0.95,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "BBC News",
    domain: "bbc.com",
    region: "global",
    language: "en",
    tags: ["global", "general", "world", "politics", "technology"],
    qualityScore: 0.92,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Al Jazeera",
    domain: "aljazeera.com",
    region: "global",
    language: "en",
    tags: ["global", "world", "politics", "middle-east"],
    qualityScore: 0.86,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "DW",
    domain: "dw.com",
    region: "europe",
    language: "en",
    tags: ["global", "world", "europe", "politics"],
    qualityScore: 0.86,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "France 24",
    domain: "france24.com",
    region: "europe",
    language: "en",
    tags: ["global", "world", "europe", "politics"],
    qualityScore: 0.84,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Financial Times",
    domain: "ft.com",
    region: "global",
    language: "en",
    tags: ["finance", "markets", "business", "technology", "global"],
    qualityScore: 0.93,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Bloomberg",
    domain: "bloomberg.com",
    region: "global",
    language: "en",
    tags: ["finance", "markets", "business", "technology", "global"],
    qualityScore: 0.9,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "The Economist",
    domain: "economist.com",
    region: "global",
    language: "en",
    tags: ["global", "politics", "finance", "business", "science"],
    qualityScore: 0.9,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "The Guardian",
    domain: "theguardian.com",
    region: "global",
    language: "en",
    tags: ["global", "world", "politics", "technology", "science"],
    qualityScore: 0.84,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Nikkei Asia",
    domain: "asia.nikkei.com",
    region: "asia",
    language: "en",
    tags: ["asia", "finance", "business", "technology", "global"],
    qualityScore: 0.88,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "South China Morning Post",
    domain: "scmp.com",
    region: "asia",
    language: "en",
    tags: ["asia", "china", "technology", "world", "global"],
    qualityScore: 0.78,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "The Hindu",
    domain: "thehindu.com",
    region: "asia",
    language: "en",
    tags: ["india", "asia", "world", "politics", "technology"],
    qualityScore: 0.82,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Politico",
    domain: "politico.com",
    region: "us-europe",
    language: "en",
    tags: ["politics", "us", "europe", "policy"],
    qualityScore: 0.82,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Ars Technica",
    domain: "arstechnica.com",
    region: "global",
    language: "en",
    tags: ["technology", "science", "ai", "hardware", "software"],
    qualityScore: 0.88,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "MIT Technology Review",
    domain: "technologyreview.com",
    region: "global",
    language: "en",
    tags: ["technology", "ai", "science", "research"],
    qualityScore: 0.89,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Wired",
    domain: "wired.com",
    region: "global",
    language: "en",
    tags: ["technology", "ai", "science", "culture"],
    qualityScore: 0.8,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "The Verge",
    domain: "theverge.com",
    region: "global",
    language: "en",
    tags: ["technology", "ai", "hardware", "apple", "software"],
    qualityScore: 0.78,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Nature",
    domain: "nature.com",
    region: "global",
    language: "en",
    tags: ["science", "research", "health", "ai"],
    qualityScore: 0.94,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Science",
    domain: "science.org",
    region: "global",
    language: "en",
    tags: ["science", "research", "health", "space"],
    qualityScore: 0.93,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "NRK",
    domain: "nrk.no",
    region: "norway",
    language: "no",
    tags: ["norway", "nordic", "general", "politics", "technology"],
    qualityScore: 0.88,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "E24",
    domain: "e24.no",
    region: "norway",
    language: "no",
    tags: ["norway", "finance", "business", "markets", "technology"],
    qualityScore: 0.8,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "SVT Nyheter",
    domain: "svt.se",
    region: "sweden",
    language: "sv",
    tags: ["sweden", "nordic", "general", "politics", "technology"],
    qualityScore: 0.87,
    defaultEnabled: true,
    userEnabled: true,
  },
  {
    name: "Dagens Nyheter",
    domain: "dn.se",
    region: "sweden",
    language: "sv",
    tags: ["sweden", "nordic", "general", "politics", "culture"],
    qualityScore: 0.82,
    defaultEnabled: true,
    userEnabled: true,
  },
];

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function rowToSource(row: Record<string, unknown>): NewsSource {
  return {
    id: String(row.id),
    name: String(row.name),
    domain: String(row.domain),
    region: String(row.region),
    language: String(row.language),
    tags: asStringArray(row.tags),
    qualityScore: Number(row.quality_score ?? 0.8),
    defaultEnabled: Boolean(row.default_enabled),
    userEnabled: Boolean(row.user_enabled),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

function sourceToRow(source: Omit<NewsSource, "id" | "createdAt" | "updatedAt">) {
  return {
    name: source.name,
    domain: source.domain,
    region: source.region,
    language: source.language,
    tags: source.tags,
    quality_score: source.qualityScore,
    default_enabled: source.defaultEnabled,
    user_enabled: source.userEnabled,
  };
}

export async function seedDefaultNewsSources(): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("news_sources")
    .upsert(DEFAULT_SOURCES.map(sourceToRow), { onConflict: "domain" });

  if (error) throw error;
}

export async function getNewsSources(): Promise<NewsSource[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("news_sources")
    .select("*")
    .order("region", { ascending: true })
    .order("quality_score", { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    await seedDefaultNewsSources();
    return getNewsSources();
  }

  return data.map((row) => rowToSource(row as Record<string, unknown>));
}

export async function getEnabledNewsSources(): Promise<NewsSource[]> {
  const sources = await getNewsSources();
  return sources.filter((source) => source.defaultEnabled && source.userEnabled);
}

export async function updateNewsSource(
  id: string,
  data: UpdateNewsSourceData,
): Promise<NewsSource> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.userEnabled !== undefined) update.user_enabled = data.userEnabled;
  if (data.qualityScore !== undefined) update.quality_score = data.qualityScore;
  if (data.tags !== undefined) update.tags = data.tags;

  const supabase = getSupabase();
  const { data: updated, error } = await supabase
    .from("news_sources")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return rowToSource(updated as Record<string, unknown>);
}
