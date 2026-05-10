export interface NewsSource {
  id: string;
  name: string;
  domain: string;
  url: string;
  category: string;
  region: string;
  language: string;
  tags: string[];
  priority: number;
  enabled: boolean;
  isDefault: boolean;
  qualityScore: number;
  defaultEnabled: boolean;
  userEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsSourceSeed {
  name: string;
  domain: string;
  region: string;
  language: string;
  tags: string[];
  qualityScore: number;
  defaultEnabled: boolean;
}

export interface UpdateNewsSourceData {
  enabled?: boolean;
  priority?: number;
}

export const DEFAULT_SOURCES: NewsSourceSeed[] = [
  {
    name: "Reuters",
    domain: "reuters.com",
    region: "global",
    language: "en",
    tags: ["global", "general", "politics", "finance", "technology", "markets"],
    qualityScore: 0.96,
    defaultEnabled: true,
  },
  {
    name: "Associated Press",
    domain: "apnews.com",
    region: "global",
    language: "en",
    tags: ["global", "general", "politics", "world"],
    qualityScore: 0.95,
    defaultEnabled: true,
  },
  {
    name: "BBC News",
    domain: "bbc.com",
    region: "global",
    language: "en",
    tags: ["global", "general", "world", "politics", "technology"],
    qualityScore: 0.92,
    defaultEnabled: true,
  },
  {
    name: "Al Jazeera",
    domain: "aljazeera.com",
    region: "global",
    language: "en",
    tags: ["global", "world", "politics", "middle-east"],
    qualityScore: 0.86,
    defaultEnabled: true,
  },
  {
    name: "DW",
    domain: "dw.com",
    region: "europe",
    language: "en",
    tags: ["global", "world", "europe", "politics"],
    qualityScore: 0.86,
    defaultEnabled: true,
  },
  {
    name: "France 24",
    domain: "france24.com",
    region: "europe",
    language: "en",
    tags: ["global", "world", "europe", "politics"],
    qualityScore: 0.84,
    defaultEnabled: true,
  },
  {
    name: "Financial Times",
    domain: "ft.com",
    region: "global",
    language: "en",
    tags: ["finance", "markets", "business", "technology", "global"],
    qualityScore: 0.93,
    defaultEnabled: true,
  },
  {
    name: "Bloomberg",
    domain: "bloomberg.com",
    region: "global",
    language: "en",
    tags: ["finance", "markets", "business", "technology", "global"],
    qualityScore: 0.9,
    defaultEnabled: true,
  },
  {
    name: "The Economist",
    domain: "economist.com",
    region: "global",
    language: "en",
    tags: ["global", "politics", "finance", "business", "science"],
    qualityScore: 0.9,
    defaultEnabled: true,
  },
  {
    name: "The Guardian",
    domain: "theguardian.com",
    region: "global",
    language: "en",
    tags: ["global", "world", "politics", "technology", "science"],
    qualityScore: 0.84,
    defaultEnabled: true,
  },
  {
    name: "Nikkei Asia",
    domain: "asia.nikkei.com",
    region: "asia",
    language: "en",
    tags: ["asia", "finance", "business", "technology", "global"],
    qualityScore: 0.88,
    defaultEnabled: true,
  },
  {
    name: "South China Morning Post",
    domain: "scmp.com",
    region: "asia",
    language: "en",
    tags: ["asia", "china", "technology", "world", "global"],
    qualityScore: 0.78,
    defaultEnabled: true,
  },
  {
    name: "The Hindu",
    domain: "thehindu.com",
    region: "asia",
    language: "en",
    tags: ["india", "asia", "world", "politics", "technology"],
    qualityScore: 0.82,
    defaultEnabled: true,
  },
  {
    name: "Politico",
    domain: "politico.com",
    region: "us-europe",
    language: "en",
    tags: ["politics", "us", "europe", "policy"],
    qualityScore: 0.82,
    defaultEnabled: true,
  },
  {
    name: "Ars Technica",
    domain: "arstechnica.com",
    region: "global",
    language: "en",
    tags: ["technology", "science", "ai", "hardware", "software"],
    qualityScore: 0.88,
    defaultEnabled: true,
  },
  {
    name: "MIT Technology Review",
    domain: "technologyreview.com",
    region: "global",
    language: "en",
    tags: ["technology", "ai", "science", "research"],
    qualityScore: 0.89,
    defaultEnabled: true,
  },
  {
    name: "Wired",
    domain: "wired.com",
    region: "global",
    language: "en",
    tags: ["technology", "ai", "science", "culture"],
    qualityScore: 0.8,
    defaultEnabled: true,
  },
  {
    name: "The Verge",
    domain: "theverge.com",
    region: "global",
    language: "en",
    tags: ["technology", "ai", "hardware", "apple", "software"],
    qualityScore: 0.78,
    defaultEnabled: true,
  },
  {
    name: "Nature",
    domain: "nature.com",
    region: "global",
    language: "en",
    tags: ["science", "research", "health", "ai"],
    qualityScore: 0.94,
    defaultEnabled: true,
  },
  {
    name: "Science",
    domain: "science.org",
    region: "global",
    language: "en",
    tags: ["science", "research", "health", "space"],
    qualityScore: 0.93,
    defaultEnabled: true,
  },
  {
    name: "Google DeepMind Blog",
    domain: "deepmind.google",
    region: "global",
    language: "en",
    tags: ["ai", "research"],
    qualityScore: 0.9,
    defaultEnabled: true,
  },
  {
    name: "OpenAI Blog",
    domain: "openai.com",
    region: "global",
    language: "en",
    tags: ["ai", "research", "product"],
    qualityScore: 0.88,
    defaultEnabled: true,
  },
  {
    name: "Anthropic News",
    domain: "anthropic.com",
    region: "us",
    language: "en",
    tags: ["ai", "research", "product"],
    qualityScore: 0.86,
    defaultEnabled: true,
  },
  {
    name: "Microsoft Research",
    domain: "microsoft.com",
    region: "global",
    language: "en",
    tags: ["ai", "research", "technology"],
    qualityScore: 0.82,
    defaultEnabled: true,
  },
  {
    name: "Apple Newsroom",
    domain: "apple.com",
    region: "global",
    language: "en",
    tags: ["technology", "apple", "hardware"],
    qualityScore: 0.78,
    defaultEnabled: true,
  },
  {
    name: "Hugging Face Blog",
    domain: "huggingface.co",
    region: "global",
    language: "en",
    tags: ["ai", "open-source", "models"],
    qualityScore: 0.76,
    defaultEnabled: true,
  },
  {
    name: "NRK",
    domain: "nrk.no",
    region: "norway",
    language: "no",
    tags: ["norway", "nordic", "general", "politics", "technology"],
    qualityScore: 0.88,
    defaultEnabled: true,
  },
  {
    name: "E24",
    domain: "e24.no",
    region: "norway",
    language: "no",
    tags: ["norway", "finance", "business", "markets", "technology"],
    qualityScore: 0.8,
    defaultEnabled: true,
  },
  {
    name: "Aftenposten",
    domain: "aftenposten.no",
    region: "norway",
    language: "no",
    tags: ["norway", "nordic", "general", "politics", "society"],
    qualityScore: 0.84,
    defaultEnabled: true,
  },
  {
    name: "VG",
    domain: "vg.no",
    region: "norway",
    language: "no",
    tags: ["norway", "nordic", "general", "breaking"],
    qualityScore: 0.78,
    defaultEnabled: true,
  },
  {
    name: "Dagens Naeringsliv",
    domain: "dn.no",
    region: "norway",
    language: "no",
    tags: ["norway", "finance", "business", "markets"],
    qualityScore: 0.84,
    defaultEnabled: true,
  },
  {
    name: "Teknisk Ukeblad",
    domain: "tu.no",
    region: "norway",
    language: "no",
    tags: ["norway", "technology", "energy", "industry"],
    qualityScore: 0.81,
    defaultEnabled: true,
  },
  {
    name: "Digi.no",
    domain: "digi.no",
    region: "norway",
    language: "no",
    tags: ["norway", "technology", "ai", "software"],
    qualityScore: 0.8,
    defaultEnabled: true,
  },
  {
    name: "SVT Nyheter",
    domain: "svt.se",
    region: "sweden",
    language: "sv",
    tags: ["sweden", "nordic", "general", "politics", "technology"],
    qualityScore: 0.87,
    defaultEnabled: true,
  },
  {
    name: "Dagens Nyheter",
    domain: "dn.se",
    region: "sweden",
    language: "sv",
    tags: ["sweden", "nordic", "general", "politics", "culture"],
    qualityScore: 0.82,
    defaultEnabled: true,
  },
  {
    name: "Sveriges Radio",
    domain: "sverigesradio.se",
    region: "sweden",
    language: "sv",
    tags: ["sweden", "nordic", "general", "politics", "society"],
    qualityScore: 0.86,
    defaultEnabled: true,
  },
  {
    name: "Svenska Dagbladet",
    domain: "svd.se",
    region: "sweden",
    language: "sv",
    tags: ["sweden", "nordic", "general", "politics", "business"],
    qualityScore: 0.82,
    defaultEnabled: true,
  },
  {
    name: "Dagens Industri",
    domain: "di.se",
    region: "sweden",
    language: "sv",
    tags: ["sweden", "finance", "business", "markets"],
    qualityScore: 0.82,
    defaultEnabled: true,
  },
  {
    name: "Ny Teknik",
    domain: "nyteknik.se",
    region: "sweden",
    language: "sv",
    tags: ["sweden", "technology", "industry", "innovation"],
    qualityScore: 0.8,
    defaultEnabled: true,
  },
  {
    name: "Omni",
    domain: "omni.se",
    region: "sweden",
    language: "sv",
    tags: ["sweden", "nordic", "general", "briefing"],
    qualityScore: 0.76,
    defaultEnabled: true,
  },
  {
    name: "Yle News",
    domain: "yle.fi",
    region: "nordic",
    language: "en",
    tags: ["nordic", "finland", "general", "politics", "society"],
    qualityScore: 0.82,
    defaultEnabled: true,
  },
  {
    name: "DR Nyheder",
    domain: "dr.dk",
    region: "nordic",
    language: "da",
    tags: ["nordic", "denmark", "general", "politics", "society"],
    qualityScore: 0.82,
    defaultEnabled: true,
  },
];

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function sourceUrl(domain: string): string {
  return `https://${domain}`;
}

export function rowToNewsSource(row: Record<string, unknown>): NewsSource {
  const domain = String(row.domain ?? "");
  const tags = asStringArray(row.tags);
  const qualityScore = Number(row.quality_score ?? 0);
  const userEnabled = Boolean(row.user_enabled);
  const defaultEnabled = Boolean(row.default_enabled);

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    domain,
    url: sourceUrl(domain),
    category: tags[0] ?? "general",
    region: String(row.region ?? ""),
    language: String(row.language ?? ""),
    tags,
    priority: Math.round(qualityScore * 100),
    enabled: defaultEnabled && userEnabled,
    isDefault: defaultEnabled,
    qualityScore,
    defaultEnabled,
    userEnabled,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}
