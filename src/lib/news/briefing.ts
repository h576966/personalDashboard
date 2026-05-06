import { searchBrave, type BraveWebResult } from "@/lib/brave";
import { getTopics, type NewsTopic } from "@/lib/db/topics";
import {
  classifyWatchUpdate,
  generateNewsBriefing,
  type NewsBriefingStory,
} from "@/lib/deepseek";
import { getBriefingPreferences } from "@/lib/db/briefingPreferences";
import {
  getNewsSources,
  seedDefaultNewsSources,
  type NewsSource,
} from "@/lib/db/newsSources";
import { getEnabledBlockedKeywords } from "@/lib/db/blockedTopics";
import { getEnabledWatchTopics, updateWatchTopicLastSeen } from "@/lib/db/watchTopics";
import { upsertStoryCards } from "@/lib/db/storyClusters";
import { stripHtml } from "@/lib/search/filter";

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

export interface StoryCard {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  score: number;
  sources: BriefingSource[];
  angles: string[];
  matchedInterests: string[];
  isWatchUpdate: boolean;
  generatedAt: string;
}

export interface DailyNewsBriefing {
  storyCards: StoryCard[];
  generatedAt: string;
}

interface FeedInterest {
  id: string;
  name: string;
  description: string;
  queries: string[];
  country?: string;
}

interface CandidateArticle extends BriefingSource {
  id: string;
  source: string;
  description: string;
  sourceQuality: number;
  freshness: number;
  matchedInterests: string[];
  isWatchUpdate: boolean;
  watchConfidence: number;
  watchReason?: string;
}

interface StoryCluster {
  id: string;
  articles: CandidateArticle[];
  score: number;
  matchedInterests: string[];
  isWatchUpdate: boolean;
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

const DEFAULT_INTERESTS: FeedInterest[] = [
  {
    id: "default-ai",
    name: "AI",
    description: "Artificial intelligence, models, products, and research",
    queries: ["AI news", "local LLM models", "AI research"],
  },
  {
    id: "default-technology",
    name: "Technology",
    description: "High-signal technology and hardware updates",
    queries: ["technology news", "Apple hardware news"],
  },
  {
    id: "default-science",
    name: "Science",
    description: "Science and research discoveries",
    queries: ["science research news"],
  },
  {
    id: "default-geopolitics",
    name: "Geopolitics",
    description: "World affairs and geopolitics",
    queries: ["geopolitics world news"],
  },
];

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

interface SourcePolicy {
  hasCuratedSources: boolean;
  enabledSources: NewsSource[];
  disabledSources: NewsSource[];
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

function hostMatchesDomain(host: string, domain: string): boolean {
  const normalizedHost = host.toLowerCase();
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
  return normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`);
}

function hostMatchesAnySource(host: string, sources: NewsSource[]): boolean {
  return sources.some((source) => hostMatchesDomain(host, source.domain));
}

function hashText(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textSimilarity(a: string, b: string): number {
  const aTokens = new Set(normalizeText(a).split(" ").filter((token) => token.length > 2));
  const bTokens = new Set(normalizeText(b).split(" ").filter((token) => token.length > 2));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection++;
  }

  return intersection / Math.max(aTokens.size, bTokens.size);
}

function freshnessScore(age?: string): number {
  if (!age) return 0.65;
  const normalized = age.toLowerCase();

  if (normalized.includes("minute") || normalized.includes("hour")) return 1;
  if (normalized.includes("day")) {
    const days = Number.parseInt(normalized, 10);
    if (Number.isFinite(days)) return Math.max(0.2, 1 - days / 7);
    return 0.75;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(age)) {
    const diffDays = (Date.now() - new Date(age).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0.1, Math.min(1, 1 - diffDays / 7));
  }

  return 0.65;
}

function containsBlockedSignal(candidate: BriefingSource, blockedKeywords: string[]): boolean {
  const text = `${candidate.title} ${candidate.description ?? ""} ${candidate.url}`;
  return containsAny(text, blockedKeywords);
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

function scoreResult(
  result: BraveWebResult,
  topic: NewsTopic,
  prefs: Awaited<ReturnType<typeof getBriefingPreferences>>,
  policy: SourcePolicy,
): number {
  const text = `${result.title} ${result.description} ${result.url}`.toLowerCase();
  const host = getHost(result.url).toLowerCase();
  let score = 0;

  if (isLikelyArticleUrl(result.url)) score += 8;

  if (prefs.prefer_global_source_mix) {
    score += sourceRegionScore(host, topic);
  }

  const curatedMatch = policy.enabledSources.find((source) =>
    hostMatchesDomain(host, source.domain),
  );
  if (curatedMatch) {
    score += 6 + Math.min(Math.max(curatedMatch.priority, 0), 100) / 25;
  }

  for (const keyword of topic.requiredKeywords) {
    if (text.includes(keyword.toLowerCase())) score += 4;
  }

  for (const source of topic.preferredSources) {
    if (host.includes(source.toLowerCase())) score += 5;
  }

  for (const source of prefs.preferred_sources) {
    if (host.includes(source.toLowerCase())) score += 3;
  }

  for (const keyword of prefs.blocked_keywords) {
    if (text.includes(keyword.toLowerCase())) score -= 10;
  }

  for (const source of prefs.blocked_sources) {
    if (host.includes(source.toLowerCase())) score -= 10;
  }

  if (result.age) score += 1;

  return score;
}

function selectSources(
  results: BraveWebResult[],
  topic: NewsTopic,
  prefs: Awaited<ReturnType<typeof getBriefingPreferences>>,
  policy: SourcePolicy,
): BriefingSource[] {
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

      if (containsAny(text, prefs.blocked_keywords)) return false;
      if (containsAny(host, prefs.blocked_sources)) return false;

      if (policy.hasCuratedSources && hostMatchesAnySource(host, policy.disabledSources)) {
        return false;
      }

      if (
        policy.hasCuratedSources &&
        policy.enabledSources.length > 0 &&
        !hostMatchesAnySource(host, policy.enabledSources)
      ) {
        return false;
      }

      if (topic.requiredKeywords.length > 0 && !containsAny(text, topic.requiredKeywords)) return false;

      return true;
    })
    .sort((a, b) => scoreResult(b, topic, prefs, policy) - scoreResult(a, topic, prefs, policy));

  const preferredGlobal: BraveWebResult[] = [];
  const diverse: BraveWebResult[] = [];
  const overflow: BraveWebResult[] = [];

  for (const result of ranked) {
    const host = getHost(result.url).toLowerCase();
    const regionScore = prefs.prefer_global_source_mix
      ? sourceRegionScore(host, topic)
      : 0;

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

function sourceHintsForTopic(topic: NewsTopic, sources: NewsSource[]): string {
  if (sources.length === 0) return "";

  const topicText = `${topic.name} ${topic.description} ${topic.queries.join(" ")}`.toLowerCase();
  const matchingSources = sources.filter((source) => {
    const category = source.category.toLowerCase();
    return category && topicText.includes(category);
  });
  const selected = (matchingSources.length > 0 ? matchingSources : sources).slice(0, 6);

  return selected.map((source) => source.name).join(" ");
}

function queryForTopic(topic: NewsTopic, sources: NewsSource[]): string {
  const query = topic.queries[0] || topic.name;
  const normalized = query.toLowerCase();
  const sourceHints = sourceHintsForTopic(topic, sources);

  if (normalized.includes("no. 1") || normalized.includes("top news")) {
    return `top world news today breaking latest international ${sourceHints || "Reuters AP BBC Al Jazeera DW"}`;
  }

  if (isBroadGlobalTopic(topic)) {
    return `${query} latest international news today ${sourceHints || "Reuters AP BBC Al Jazeera"}`;
  }

  return `${query} latest news today ${sourceHints}`.trim();
}

async function getSourcePolicy(): Promise<SourcePolicy> {
  try {
    let sources = await getNewsSources();
    if (sources.length === 0) {
      sources = await seedDefaultNewsSources();
    }

    return {
      hasCuratedSources: sources.length > 0,
      enabledSources: sources.filter((source) => source.enabled),
      disabledSources: sources.filter((source) => !source.enabled),
    };
  } catch (err) {
    console.warn("Failed to load curated news sources; using legacy source selection:", err);
    return {
      hasCuratedSources: false,
      enabledSources: [],
      disabledSources: [],
    };
  }
}

function interestsFromTopics(topics: NewsTopic[]): FeedInterest[] {
  const enabled = topics.filter((topic) => topic.enabled);
  if (enabled.length === 0) return DEFAULT_INTERESTS;

  return enabled.map((topic) => ({
    id: topic.id,
    name: topic.name,
    description: topic.description,
    queries: topic.queries.length > 0 ? topic.queries : [topic.name],
    country: topic.country && topic.country !== "all" ? topic.country : undefined,
  }));
}

function sourceForHost(host: string, sources: NewsSource[]): NewsSource | null {
  return sources.find((source) => hostMatchesDomain(host, source.domain)) ?? null;
}

function candidateFromResult(input: {
  result: BraveWebResult;
  interestName: string;
  policy: SourcePolicy;
  blockedKeywords: string[];
  isWatchUpdate?: boolean;
  watchConfidence?: number;
  watchReason?: string;
}): CandidateArticle | null {
  const title = input.result.title?.trim();
  const url = input.result.url?.trim();
  if (!title || !url || !isLikelyArticleUrl(url)) return null;

  const host = getHost(url).toLowerCase();
  if (!host) return null;

  if (input.policy.hasCuratedSources && hostMatchesAnySource(host, input.policy.disabledSources)) {
    return null;
  }

  if (
    input.policy.hasCuratedSources &&
    input.policy.enabledSources.length > 0 &&
    !hostMatchesAnySource(host, input.policy.enabledSources)
  ) {
    return null;
  }

  const description = stripHtml(input.result.description ?? "");
  const candidate = {
    title,
    url,
    description,
    source: host,
  };

  if (containsBlockedSignal(candidate, input.blockedKeywords)) return null;

  const source = sourceForHost(host, input.policy.enabledSources);

  return {
    ...candidate,
    id: hashText(`${title}|${url}`),
    sourceQuality: source?.qualityScore ?? 0.55,
    freshness: freshnessScore(input.result.age),
    matchedInterests: [input.interestName],
    isWatchUpdate: input.isWatchUpdate ?? false,
    watchConfidence: input.watchConfidence ?? 0,
    watchReason: input.watchReason,
  };
}

async function collectInterestCandidates(input: {
  interests: FeedInterest[];
  policy: SourcePolicy;
  blockedKeywords: string[];
}): Promise<CandidateArticle[]> {
  const candidates: CandidateArticle[] = [];
  const seenUrls = new Set<string>();

  for (const interest of input.interests.slice(0, 6)) {
    const queries = interest.queries.length > 0 ? interest.queries : [interest.name];

    for (const rawQuery of queries.slice(0, 2)) {
      const query = `${rawQuery} latest news today ${sourceHintsForTopic(
        {
          id: interest.id,
          name: interest.name,
          description: interest.description,
          queries: interest.queries,
          country: interest.country ?? "",
          region: "",
          language: "",
          preferredSources: [],
          blockedSources: [],
          requiredKeywords: [],
          blockedKeywords: [],
          maxItemsPerDay: 5,
          minScore: 0,
          enabled: true,
          createdAt: "",
          updatedAt: "",
        },
        input.policy.enabledSources,
      )}`.trim();

      try {
        const raw = await searchBrave(query, 12, "pd", interest.country);
        for (const result of raw.web?.results ?? []) {
          if (!result.url || seenUrls.has(result.url.toLowerCase())) continue;

          const candidate = candidateFromResult({
            result,
            interestName: interest.name,
            policy: input.policy,
            blockedKeywords: input.blockedKeywords,
          });

          if (!candidate) continue;
          seenUrls.add(candidate.url.toLowerCase());
          candidates.push(candidate);
        }
      } catch (err) {
        console.warn(`Failed to collect candidates for "${interest.name}":`, err);
      }
    }
  }

  return candidates;
}

async function collectWatchCandidates(input: {
  policy: SourcePolicy;
  blockedKeywords: string[];
}): Promise<CandidateArticle[]> {
  const watchTopics = await getEnabledWatchTopics();
  const candidates: CandidateArticle[] = [];

  for (const topic of watchTopics) {
    const results: CandidateArticle[] = [];
    const domains = topic.sourceDomains.map((domain) => domain.toLowerCase());

    for (const query of (topic.queries.length > 0 ? topic.queries : [topic.name]).slice(0, 2)) {
      try {
        const raw = await searchBrave(`${query} latest update`, 8, "pw");

        for (const result of raw.web?.results ?? []) {
          const host = result.url ? getHost(result.url).toLowerCase() : "";
          if (domains.length > 0 && !domains.some((domain) => hostMatchesDomain(host, domain))) {
            continue;
          }

          const candidate = candidateFromResult({
            result,
            interestName: topic.name,
            policy: input.policy,
            blockedKeywords: input.blockedKeywords,
            isWatchUpdate: true,
          });

          if (candidate) results.push(candidate);
        }
      } catch (err) {
        console.warn(`Failed to scan watch topic "${topic.name}":`, err);
      }
    }

    const uniqueSources = new Set(results.map((result) => result.source));
    const officialSource = domains.length > 0 &&
      results.some((result) => domains.some((domain) => hostMatchesDomain(result.source, domain)));
    const hash = hashText(results.map((result) => `${result.title}|${result.url}`).join("\n"));

    if (results.length === 0 || hash === topic.lastSeenHash) continue;

    try {
      const classification = await classifyWatchUpdate({
        watchTopic: topic.name,
        lastSeenHash: topic.lastSeenHash,
        sources: results.slice(0, 4),
      });

      const shouldShow = classification.confidence >= 0.75 ||
        uniqueSources.size >= 2 ||
        officialSource;

      if (classification.isMeaningfulUpdate && shouldShow) {
        candidates.push(
          ...results.slice(0, 4).map((result) => ({
            ...result,
            watchConfidence: classification.confidence,
            watchReason: classification.reason,
          })),
        );
        await updateWatchTopicLastSeen(topic.id, hash);
      }
    } catch (err) {
      if (uniqueSources.size >= 2 || officialSource) {
        candidates.push(...results.slice(0, 4));
      } else {
        console.warn(`Watch topic classification failed for "${topic.name}":`, err);
      }
    }
  }

  return candidates;
}

function clusterCandidates(candidates: CandidateArticle[]): StoryCluster[] {
  const clusters: StoryCluster[] = [];

  for (const candidate of candidates) {
    const match = clusters.find((cluster) => {
      const representative = cluster.articles[0];
      return (
        textSimilarity(candidate.title, representative.title) >= 0.58 ||
        textSimilarity(candidate.description ?? "", representative.description ?? "") >= 0.62
      );
    });

    if (match) {
      match.articles.push(candidate);
      match.matchedInterests = [...new Set([
        ...match.matchedInterests,
        ...candidate.matchedInterests,
      ])];
      match.isWatchUpdate = match.isWatchUpdate || candidate.isWatchUpdate;
    } else {
      clusters.push({
        id: `story_${hashText(normalizeText(candidate.title))}`,
        articles: [candidate],
        score: 0,
        matchedInterests: candidate.matchedInterests,
        isWatchUpdate: candidate.isWatchUpdate,
      });
    }
  }

  return clusters;
}

function scoreCluster(
  cluster: StoryCluster,
  interests: FeedInterest[],
  blockedKeywords: string[],
): StoryCluster {
  const uniqueSources = new Set(cluster.articles.map((article) => article.source));
  const sourceQuality = Math.max(...cluster.articles.map((article) => article.sourceQuality));
  const interestMatch = Math.min(cluster.matchedInterests.length / Math.max(interests.length, 1), 1);
  const freshness = Math.max(...cluster.articles.map((article) => article.freshness));
  const feedbackAffinity = 0;
  const sourceDiversity = Math.min(uniqueSources.size / 3, 1);
  const watchSignificance = cluster.isWatchUpdate
    ? Math.max(...cluster.articles.map((article) => article.watchConfidence || 0.8))
    : 0;
  const blockedPenalty = cluster.articles.some((article) =>
    containsBlockedSignal(article, blockedKeywords),
  ) ? 1 : 0;
  const duplicatePenalty = cluster.articles.length > uniqueSources.size ? 0.25 : 0;

  return {
    ...cluster,
    score:
      sourceQuality * 25 +
      interestMatch * 20 +
      freshness * 15 +
      feedbackAffinity * 15 +
      sourceDiversity * 10 +
      watchSignificance * 30 -
      blockedPenalty * 100 -
      duplicatePenalty * 50,
  };
}

async function summarizeCluster(cluster: StoryCluster): Promise<StoryCard> {
  const sources = cluster.articles.slice(0, 5).map((article) => ({
    title: article.title,
    url: article.url,
    source: article.source,
    description: article.description,
  }));

  try {
    const generated = await generateNewsBriefing({
      topicName: cluster.isWatchUpdate ? "Watch topic update" : "Top daily story",
      topicDescription: cluster.matchedInterests.join(", "),
      sources,
    });

    return {
      id: cluster.id,
      title: generated.title,
      summary: generated.summary,
      whyItMatters: generated.whyItMatters,
      score: Math.round(cluster.score),
      sources,
      angles: generated.angles,
      matchedInterests: cluster.matchedInterests,
      isWatchUpdate: cluster.isWatchUpdate,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`Failed to summarize story cluster ${cluster.id}:`, err);
    const representative = cluster.articles[0];

    return {
      id: cluster.id,
      title: representative.title,
      summary: representative.description || "Summary unavailable from the available snippets.",
      whyItMatters: cluster.isWatchUpdate
        ? representative.watchReason ?? "This matched a watch topic."
        : "This story ranked highly across trusted sources and configured interests.",
      score: Math.round(cluster.score),
      sources,
      angles: [],
      matchedInterests: cluster.matchedInterests,
      isWatchUpdate: cluster.isWatchUpdate,
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function buildDailyNewsBriefing(): Promise<DailyNewsBriefing> {
  const [topics, prefs, policy, blockedTopicKeywords] = await Promise.all([
    getTopics(),
    getBriefingPreferences(),
    getSourcePolicy(),
    getEnabledBlockedKeywords(),
  ]);
  const interests = interestsFromTopics(topics);
  const blockedKeywords = [
    ...new Set([
      ...blockedTopicKeywords,
      ...prefs.blocked_keywords,
    ]),
  ];

  const [interestCandidates, watchCandidates] = await Promise.all([
    collectInterestCandidates({ interests, policy, blockedKeywords }),
    collectWatchCandidates({ policy, blockedKeywords }),
  ]);

  const rankedClusters = clusterCandidates([...watchCandidates, ...interestCandidates])
    .map((cluster) => scoreCluster(cluster, interests, blockedKeywords))
    .filter((cluster) => cluster.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const storyCards = await Promise.all(rankedClusters.map((cluster) => summarizeCluster(cluster)));

  try {
    await upsertStoryCards(storyCards);
  } catch (err) {
    console.warn("Failed to persist story cards:", err);
  }

  return {
    storyCards,
    generatedAt: new Date().toISOString(),
  };
}

export async function buildNewsBriefing(topic: NewsTopic): Promise<NewsBriefing | null> {
  const prefs = await getBriefingPreferences();
  const policy = await getSourcePolicy();

  const query = queryForTopic(topic, policy.enabledSources);
  const country = topic.country && topic.country !== "all" ? topic.country : undefined;

  const raw = await searchBrave(query, 18, "pd", country);

  const sources = selectSources(raw.web?.results ?? [], topic, prefs, policy);

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
