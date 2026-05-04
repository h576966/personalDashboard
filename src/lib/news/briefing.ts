import { searchBrave, type BraveWebResult } from "@/lib/brave";
import { getTopics, type NewsTopic } from "@/lib/db/topics";
import { generateNewsBriefing } from "@/lib/deepseek";

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
  imageUrl?: string | null;
  sources: BriefingSource[];
  generatedAt: string;
}

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

function scoreResult(result: BraveWebResult, topic: NewsTopic): number {
  const text = `${result.title} ${result.description} ${result.url}`.toLowerCase();
  const host = getHost(result.url).toLowerCase();
  let score = 0;

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
  const seen = new Set<string>();

  return results
    .filter((result) => {
      if (!result.url || seen.has(result.url)) return false;
      seen.add(result.url);

      const host = getHost(result.url).toLowerCase();
      const text = `${result.title} ${result.description} ${result.url}`;

      if (containsAny(host, topic.blockedSources)) return false;
      if (containsAny(text, topic.blockedKeywords)) return false;
      if (topic.requiredKeywords.length > 0 && !containsAny(text, topic.requiredKeywords)) return false;

      return true;
    })
    .sort((a, b) => scoreResult(b, topic) - scoreResult(a, topic))
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
  return `${query} latest news`;
}

export async function buildNewsBriefing(topic: NewsTopic): Promise<NewsBriefing | null> {
  const query = queryForTopic(topic);
  const country = topic.country && topic.country !== "all" ? topic.country : undefined;
  const raw = await searchBrave(query, 10, "pd", country);
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
