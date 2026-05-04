import { searchBrave, type BraveWebResult } from "@/lib/brave";
import { getTopics, type NewsTopic } from "@/lib/db/topics";
import { generateNewsBriefing, type NewsBriefingStory } from "@/lib/deepseek";

export interface BriefingSource {
  title: string;
  url: string;
  source?: string;
  description?: string;
}

export interface NewsBriefing {
  topicId: string;
  topicName: string;
  title: string;
  summary: string;
  whyItMatters: string;
  angles: string[];
  stories: NewsBriefingStory[];
  imageUrl?: string | null;
  sources: BriefingSource[];
  generatedAt: string;
}

const SECTION_PATHS = new Set([
  "",
  "news",
  "world",
  "technology",
  "tech",
  "business",
  "markets",
  "science",
  "sports",
  "politics",
  "latest",
  "breaking-news",
]);

const GLOBAL_SOURCE_HINTS = [
  "reuters.com",
  "apnews.com",
  "bbc.",
  "aljazeera.com",
  "dw.com",
  "france24.com",
  "lemonde.fr",
  "theguardian.com",
  "ft.com",
  "nikkei.com",
  "scmp.com",
  "straitstimes.com",
  "thehindu.com",
  "elpais.com",
  "africanews.com",
];

const US_SOURCE_HINTS = [
  "nytimes.com",
  "washingtonpost.com",
  "wsj.com",
  "cnn.com",
  "nbcnews.com",
  "cbsnews.com",
  "abcnews.go.com",
  "foxnews.com",
  "politico.com",
];

function getHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function containsAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

function isBroadGlobalTopic(topic: NewsTopic): boolean {
  const text = `${topic.name} ${topic.description} ${topic.queries.join(" ")}`.toLowerCase();
  return ["global", "world", "international", "top news", "no. 1", "breaking"].some((term) =>
    text.includes(term),
  );
}

function sourceRegionScore(host: string, topic: NewsTopic): number {
  if (!isBroadGlobalTopic(topic)) return 0;

  const normalizedHost = host.toLowerCase();

  if (GLOBAL_SOURCE_HINTS.some((hint) => normalizedHost.includes(hint))) return 4;
  if (US_SOURCE_HINTS.some((hint) => normalizedHost.includes(hint))) return -1;

  if (/\.(uk|de|fr|es|it|nl|se|no|dk|fi|jp|kr|in|sg|za|br|mx|au|nz)$/.test(normalizedHost)) {
    return 3;
  }

  return 0;
}

function isLikelyArticleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname
      .replace(/\/$/, "")
      .split("/")
      .filter(Boolean);

    if (segments.length === 0) return false;
    if (segments.length === 1 && SECTION_PATHS.has(segments[0].toLowerCase())) return false;

    const path = parsed.pathname.toLowerCase();
    const last = segments.at(-1)?.toLowerCase() ?? "";
    const hasLongSlug = last.length >= 18 && last.includes("-");
    const hasArticleMarker = /\/articles?\/|\/story\/|\/news\/articles?\//.test(path);
    const hasDatePath = /\/20\d{2}\/(0?[1-9]|1[0-2])\//.test(path);
    const hasNumericId = /\d{5,}/.test(path);

    return hasLongSlug || hasArticleMarker || hasDatePath || hasNumericId;
  } catch {
    return false;
  }
}

function scoreResult(result: BraveWebResult, topic: NewsTopic): number {
  const text = `${result.title} ${result.description} ${result.url}`.toLowerCase();
  const host = getHost(result.url).toLowerCase();
  let score = 0;

  if (isLikelyArticleUrl(result.url)) score += 8;
  score += sourceRegionScore(host, topic);

  for (const keyword of topic.requiredKeywords) {
    if (text.includes(keyword.toLowerCase())) score += 4;
  }

  for (const source of topic.preferredSources) {
    if (host.includes(source.toLowerCase())) score += 5;
  }

  if (result.age) score += 1;

  return score;
}

function selectSources(results: BraveWebResult[], topic: NewsTopic): BriefingSource[] {
  const seenUrls = new Set<string>();
  const seenHosts = new Set<string>();
  const broadGlobalTopic = isBroadGlobalTopic(topic);

  const ranked = results
    .filter((result) => {
      if (!result.url || seenUrls.has(result.url)) return false;
      seenUrls.add(result.url);

      const host = getHost(result.url).toLowerCase();
      const text = `${result.title} ${result.description} ${result.url}`;

      if (!isLikelyArticleUrl(result.url)) return false;
      if (containsAny(host, topic.blockedSources)) return false;
      if (containsAny(text, topic.blockedKeywords)) return false;
      if (topic.requiredKeywords.length > 0 && !containsAny(text, topic.requiredKeywords)) return false;

      return true;
    })
    .sort((a, b) => scoreResult(b, topic) - scoreResult(a, topic));

  const preferredGlobal: BraveWebResult[] = [];
  const diverse: BraveWebResult[] = [];
  const overflow: BraveWebResult[] = [];

  for (const result of ranked) {
    const host = getHost(result.url).toLowerCase();
    const regionScore = sourceRegionScore(host, topic);

    if (!seenHosts.has(host)) {
      if (broadGlobalTopic && regionScore > 0) {
        preferredGlobal.push(result);
      } else {
        diverse.push(result);
      }
      seenHosts.add(host);
    } else {
      overflow.push(result);
    }
  }

  return [...preferredGlobal, ...diverse, ...overflow]
    .slice(0, 5)
    .map((result) => ({
      title: result.title,
      url: result.url,
      source: getHost(result.url),
      description: result.description,
    }));
}

function queryForTopic(topic: NewsTopic): string {
  const query = topic.queries[0] || topic.name;
  const normalized = query.toLowerCase();

  if (normalized.includes("no. 1") || normalized.includes("top news")) {
    return "top world news today breaking latest international Reuters AP BBC Al Jazeera DW France24";
  }

  if (isBroadGlobalTopic(topic)) {
    return `${query} latest international news today Reuters AP BBC Al Jazeera`;
  }

  return `${query} latest news today`;
}

export async function buildNewsBriefing(topic: NewsTopic): Promise<NewsBriefing | null> {
  const query = queryForTopic(topic);
  const country = topic.country && topic.country !== "all" ? topic.country : undefined;
  const raw = await searchBrave(query, 18, "pd", country);
  const sources = selectSources(raw.web?.results ?? [], topic);

  if (sources.length === 0) return null;

  const generated = await generateNewsBriefing({
    topicName: topic.name,
    topicDescription: topic.description,
    sources,
  });

  return {
    topicId: topic.id,
    topicName: topic.name,
    title: generated.title,
    summary: generated.summary,
    whyItMatters: generated.whyItMatters,
    angles: generated.angles,
    stories: generated.stories ?? [],
    imageUrl: null,
    sources,
    generatedAt: new Date().toISOString(),
  };
}

export async function buildNewsBriefings(): Promise<NewsBriefing[]> {
  const topics = (await getTopics()).filter((topic) => topic.enabled).slice(0, 5);
  const briefings = await Promise.all(
    topics.map(async (topic) => {
      try {
        return await buildNewsBriefing(topic);
      } catch (err) {
        console.warn(`Failed to build briefing for topic ${topic.name}:`, err);
        return null;
      }
    }),
  );

  return briefings.filter((briefing): briefing is NewsBriefing => briefing !== null);
}
