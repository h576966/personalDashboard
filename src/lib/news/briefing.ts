import { searchBrave, type BraveWebResult } from "@/lib/brave";
import { getTopics, type NewsTopic } from "@/lib/db/topics";
import { classifyWatchUpdate, generateNewsBriefing } from "@/lib/deepseek";
import {
  getBriefingPreferences,
  type BriefingPreferences,
  type RegionalFocus,
  type SummaryLanguage,
} from "@/lib/db/briefingPreferences";
import {
  getNewsSources,
  seedDefaultNewsSources,
  type NewsSource,
} from "@/lib/db/newsSources";
import { getEnabledBlockedKeywords } from "@/lib/db/blockedTopics";
import { getEnabledWatchTopics, updateWatchTopicLastSeen } from "@/lib/db/watchTopics";
import { replaceTodaysStoryCards } from "@/lib/db/storyClusters";
import {
  getNewsPersonalizationSignals,
  type NewsPersonalizationSignals,
} from "@/lib/db/newsPersonalization";
import { stripHtml } from "@/lib/search/filter";

export interface BriefingSource {
  title: string;
  url: string;
  source?: string;
  description?: string;
}

export interface StoryBreakdownItem {
  title: string;
  summary: string;
  sourceUrls: string[];
}

export interface StoryCard {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  score: number;
  sources: BriefingSource[];
  angles: string[];
  storyBreakdown: StoryBreakdownItem[];
  imageUrl?: string;
  imageSource?: string;
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
  imageUrl?: string;
  sourceQuality: number;
  regionalRelevance: number;
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

const NON_VISUAL_INTERESTS = new Set([
  "Nordic economy and society",
  "Geopolitics",
]);

const NON_STORY_IMAGE_TERMS = [
  "logo",
  "icon",
  "favicon",
  "avatar",
  "profile",
  "placeholder",
  "default",
  "brand",
  "sprite",
];

const DEFAULT_INTERESTS: FeedInterest[] = [
  {
    id: "default-nordic-headlines",
    name: "Nordic headlines",
    description: "High-signal Norway and Sweden news with global context",
    queries: ["Norway Sweden top news", "Nordic news"],
  },
  {
    id: "default-nordic-economy",
    name: "Nordic economy and society",
    description: "Norwegian and Swedish economy, society, energy, and policy",
    queries: ["Norway Sweden economy society", "Nordic energy housing interest rates"],
  },
  {
    id: "default-nordic-tech",
    name: "Nordic technology and AI",
    description: "Technology, AI, software, and industry with Nordic relevance",
    queries: ["Nordic technology AI news", "Norway Sweden technology"],
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
    description: "World affairs and geopolitics relevant to Europe and the Nordics",
    queries: ["Europe Nordic geopolitics NATO security"],
  },
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

function validHttpsUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function isLikelyStoryImageUrl(value: string): boolean {
  const url = validHttpsUrl(value);
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const searchable = `${parsed.hostname} ${parsed.pathname} ${parsed.search}`.toLowerCase();
    return !NON_STORY_IMAGE_TERMS.some((term) => searchable.includes(term));
  } catch {
    return false;
  }
}

function imageUrlFromResult(result: BraveWebResult): string {
  if (typeof result.thumbnail === "string") {
    return isLikelyStoryImageUrl(result.thumbnail) ? validHttpsUrl(result.thumbnail) : "";
  }

  if (result.thumbnail && result.thumbnail.logo !== true) {
    const imageUrl = validHttpsUrl(result.thumbnail.original) || validHttpsUrl(result.thumbnail.src);
    return isLikelyStoryImageUrl(imageUrl) ? imageUrl : "";
  }

  return "";
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

function sourceRegion(source: NewsSource | null, host: string): string {
  if (source?.region) return source.region.toLowerCase();
  if (host.endsWith(".no")) return "norway";
  if (host.endsWith(".se")) return "sweden";
  if (host.endsWith(".fi") || host.endsWith(".dk")) return "nordic";
  return "";
}

function regionalRelevanceForHost(
  host: string,
  sources: NewsSource[],
  focus: RegionalFocus,
): number {
  if (focus === "global") return 0;

  const region = sourceRegion(sourceForHost(host, sources), host);

  if (focus === "nordic") {
    if (region === "norway" || region === "sweden") return 1;
    if (region === "nordic") return 0.75;
    if (region === "europe" || region === "us-europe" || region === "global") return 0.25;
    return 0;
  }

  if (region === focus) return 1;
  if (region === "nordic") return 0.45;
  if ((focus === "norway" && region === "sweden") || (focus === "sweden" && region === "norway")) {
    return 0.25;
  }

  return 0;
}

function searchCountriesForFocus(focus: RegionalFocus, explicitCountry?: string): Array<string | undefined> {
  if (explicitCountry) return [explicitCountry];
  if (focus === "norway") return ["NO"];
  if (focus === "sweden") return ["SE"];
  if (focus === "nordic") return ["NO", "SE", undefined];
  return [undefined];
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
    const hasLongSlug = segments.length >= 3 && last.length >= 18 && last.includes("-");
    const hasArticleMarker = /\/articles?\/|\/story\/|\/news\/articles?\//.test(path);
    const hasDatePath = /\/20\d{2}\/(0?[1-9]|1[0-2])\//.test(path);
    const hasNumericId = /\d{5,}/.test(path);

    return hasLongSlug || hasArticleMarker || hasDatePath || hasNumericId;
  } catch {
    return false;
  }
}

function sourceHintsForTopic(
  topic: NewsTopic,
  sources: NewsSource[],
  regionalFocus: RegionalFocus = "global",
): string {
  if (sources.length === 0) return "";

  const topicText = `${topic.name} ${topic.description} ${topic.queries.join(" ")}`.toLowerCase();
  const regionalSources = sources.filter((source) => {
    if (regionalFocus === "norway") return source.region === "norway";
    if (regionalFocus === "sweden") return source.region === "sweden";
    if (regionalFocus === "nordic") {
      return ["norway", "sweden", "nordic"].includes(source.region);
    }
    return false;
  });
  const sourcePool = regionalSources.length > 0 ? regionalSources : sources;
  const matchingSources = sourcePool.filter((source) => {
    const category = source.category.toLowerCase();
    return category && topicText.includes(category);
  });
  const selected = (matchingSources.length > 0 ? matchingSources : sourcePool).slice(0, 6);

  return selected.map((source) => source.name).join(" ");
}

function queryForTopic(
  topic: NewsTopic,
  sources: NewsSource[],
  regionalFocus: RegionalFocus = "global",
): string {
  const query = topic.queries[0] || topic.name;
  const normalized = query.toLowerCase();
  const sourceHints = sourceHintsForTopic(topic, sources, regionalFocus);
  const regionalPrefix =
    regionalFocus === "norway"
      ? "Norway Norwegian"
      : regionalFocus === "sweden"
        ? "Sweden Swedish"
        : regionalFocus === "nordic"
          ? "Norway Sweden Nordic"
          : "";

  if (normalized.includes("no. 1") || normalized.includes("top news")) {
    return `${regionalPrefix} top news today breaking latest international ${sourceHints || "Reuters AP BBC Al Jazeera DW"}`.trim();
  }

  if (isBroadGlobalTopic(topic)) {
    return `${regionalPrefix} ${query} latest international news today ${sourceHints || "Reuters AP BBC Al Jazeera"}`.trim();
  }

  return `${regionalPrefix} ${query} latest news today ${sourceHints}`.trim();
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
  regionalFocus: RegionalFocus;
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
    imageUrl: imageUrlFromResult(input.result),
    sourceQuality: source?.qualityScore ?? 0.55,
    regionalRelevance: regionalRelevanceForHost(host, input.policy.enabledSources, input.regionalFocus),
    freshness: freshnessScore(input.result.age),
    matchedInterests: [input.interestName],
    isWatchUpdate: input.isWatchUpdate ?? false,
    watchConfidence: input.watchConfidence ?? 0,
    watchReason: input.watchReason,
  };
}

function clusterImage(cluster: StoryCluster): { imageUrl: string; imageSource: string } {
  const hasVisualInterest = cluster.matchedInterests.some(
    (interest) => !NON_VISUAL_INTERESTS.has(interest),
  );
  if (!hasVisualInterest) return { imageUrl: "", imageSource: "" };

  const article = cluster.articles.find((candidate) =>
    candidate.imageUrl ? isLikelyStoryImageUrl(candidate.imageUrl) : false,
  );
  if (!article?.imageUrl) return { imageUrl: "", imageSource: "" };

  return {
    imageUrl: article.imageUrl,
    imageSource: article.source,
  };
}

async function collectInterestCandidates(input: {
  interests: FeedInterest[];
  policy: SourcePolicy;
  blockedKeywords: string[];
  prefs: BriefingPreferences;
}): Promise<CandidateArticle[]> {
  const candidates: CandidateArticle[] = [];
  const seenUrls = new Set<string>();
  const queryLimit = input.prefs.regional_focus === "global" ? 2 : 1;

  for (const interest of input.interests.slice(0, 6)) {
    const queries = interest.queries.length > 0 ? interest.queries : [interest.name];

    for (const rawQuery of queries.slice(0, queryLimit)) {
      const topicForQuery = {
        id: interest.id,
        name: interest.name,
        description: interest.description,
        queries: [rawQuery],
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
      };
      const query = queryForTopic(
        topicForQuery,
        input.policy.enabledSources,
        input.prefs.regional_focus,
      );
      const countries = searchCountriesForFocus(input.prefs.regional_focus, interest.country);

      for (const country of countries) {
        try {
          const raw = await searchBrave(query, 12, "pd", country);
          for (const result of raw.web?.results ?? []) {
            if (!result.url || seenUrls.has(result.url.toLowerCase())) continue;

            const candidate = candidateFromResult({
              result,
              interestName: interest.name,
              policy: input.policy,
              blockedKeywords: input.blockedKeywords,
              regionalFocus: input.prefs.regional_focus,
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
  }

  return candidates;
}

async function collectWatchCandidates(input: {
  policy: SourcePolicy;
  blockedKeywords: string[];
  regionalFocus: RegionalFocus;
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
            regionalFocus: input.regionalFocus,
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
  blockedCategories: string[],
  personalization: NewsPersonalizationSignals,
): StoryCluster {
  const uniqueSources = new Set(cluster.articles.map((article) => article.source));
  const sourceQuality = Math.max(...cluster.articles.map((article) => article.sourceQuality));
  const interestMatch = Math.min(cluster.matchedInterests.length / Math.max(interests.length, 1), 1);
  const freshness = Math.max(...cluster.articles.map((article) => article.freshness));
  const regionalRelevance = Math.max(...cluster.articles.map((article) => article.regionalRelevance));
  const feedbackAffinity = personalization.feedbackAffinityByStory.get(cluster.id) ?? 0;
  const interestAffinities = cluster.matchedInterests.map(
    (interest) => personalization.feedbackAffinityByInterest.get(interest.toLowerCase()) ?? 0,
  );
  const maxInterestAffinity = Math.max(...interestAffinities, 0);
  const minInterestAffinity = Math.min(...interestAffinities, 0);
  const netInterestAffinity = maxInterestAffinity + minInterestAffinity;
  const savedArticleAffinity = Math.max(
    ...cluster.articles.map((article) => {
      const status = personalization.savedUrlStatusByUrl.get(article.url);
      if (!status) return 0;
      return status === "archived" ? -1 : 1;
    }),
  );
  const savedHostAffinity = Math.max(
    ...cluster.articles.map((article) =>
      personalization.savedHostAffinityByHost.get(getHost(article.url).toLowerCase()) ?? 0,
    ),
  );
  const sourceDiversity = Math.min(uniqueSources.size / 3, 1);
  const watchSignificance = cluster.isWatchUpdate
    ? Math.max(...cluster.articles.map((article) => article.watchConfidence || 0.8))
    : 0;
  const blockedPenalty = cluster.articles.some((article) =>
    containsBlockedSignal(article, blockedKeywords),
  ) ? 1 : 0;
  const allInterestsBlocked = blockedCategories.length > 0 &&
    cluster.matchedInterests.length > 0 &&
    cluster.matchedInterests.every((interest) =>
      blockedCategories.some((cat) => interest.toLowerCase().includes(cat.toLowerCase())),
    );
  const categoryBlockedPenalty = allInterestsBlocked ? 1 : 0;
  const duplicatePenalty = cluster.articles.length > uniqueSources.size ? 0.25 : 0;

  return {
    ...cluster,
    score:
      sourceQuality * 25 +
      interestMatch * 20 +
      freshness * 15 +
      regionalRelevance * 12 +
      feedbackAffinity * 15 +
      netInterestAffinity * 15 +
      savedArticleAffinity * 8 +
      savedHostAffinity * 6 +
      sourceDiversity * 10 +
      watchSignificance * 30 -
      blockedPenalty * 100 -
      categoryBlockedPenalty * 100 -
      duplicatePenalty * 50,
  };
}

async function summarizeCluster(
  cluster: StoryCluster,
  summaryLanguage: SummaryLanguage,
  generatedAt: string,
): Promise<StoryCard> {
  const sources = cluster.articles.slice(0, 5).map((article) => ({
    title: article.title,
    url: article.url,
    source: article.source,
    description: article.description,
  }));
  const image = clusterImage(cluster);

  try {
    const generated = await generateNewsBriefing({
      topicName: cluster.isWatchUpdate ? "Watch topic update" : "Top daily story",
      topicDescription: cluster.matchedInterests.join(", "),
      sources,
      language: summaryLanguage,
    });

    return {
      id: cluster.id,
      title: generated.title,
      summary: generated.summary,
      whyItMatters: generated.whyItMatters,
      score: Math.round(cluster.score),
      sources,
      angles: generated.angles,
      storyBreakdown: generated.stories ?? [],
      imageUrl: image.imageUrl,
      imageSource: image.imageSource,
      matchedInterests: cluster.matchedInterests,
      isWatchUpdate: cluster.isWatchUpdate,
      generatedAt,
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
      storyBreakdown: [],
      imageUrl: image.imageUrl,
      imageSource: image.imageSource,
      matchedInterests: cluster.matchedInterests,
      isWatchUpdate: cluster.isWatchUpdate,
      generatedAt,
    };
  }
}

interface CollectPipelineInput {
  interests: FeedInterest[];
  policy: SourcePolicy;
  blockedKeywords: string[];
  prefs: Awaited<ReturnType<typeof getBriefingPreferences>>;
}

async function collectBriefingCandidates(input: CollectPipelineInput): Promise<CandidateArticle[]> {
  const [interestCandidates, watchCandidates] = await Promise.all([
    collectInterestCandidates({
      interests: input.interests,
      policy: input.policy,
      blockedKeywords: input.blockedKeywords,
      prefs: input.prefs,
    }),
    collectWatchCandidates({
      policy: input.policy,
      blockedKeywords: input.blockedKeywords,
      regionalFocus: input.prefs.regional_focus,
    }),
  ]);

  return [...watchCandidates, ...interestCandidates];
}

function rankBriefingClusters(input: {
  candidates: CandidateArticle[];
  interests: FeedInterest[];
  blockedKeywords: string[];
  blockedCategories: string[];
  personalization: NewsPersonalizationSignals;
}): StoryCluster[] {
  return clusterCandidates(input.candidates)
    .map((cluster) =>
      scoreCluster(
        cluster,
        input.interests,
        input.blockedKeywords,
        input.blockedCategories,
        input.personalization,
      ))
    .filter((cluster) => cluster.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function generateStoryCards(input: {
  rankedClusters: StoryCluster[];
  summaryLanguage: SummaryLanguage;
  generatedAt: string;
}): Promise<StoryCard[]> {
  return Promise.all(
    input.rankedClusters.map((cluster) =>
      summarizeCluster(cluster, input.summaryLanguage, input.generatedAt),
    ),
  );
}

async function persistStoryCards(storyCards: StoryCard[]): Promise<void> {
  try {
    await replaceTodaysStoryCards(storyCards);
  } catch (err) {
    console.warn("Failed to persist story cards:", err);
  }
}

export async function buildDailyNewsBriefing(householdId: string): Promise<DailyNewsBriefing> {
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
  const blockedCategories = prefs.blocked_categories ?? [];

  const candidates = await collectBriefingCandidates({
    interests,
    policy,
    blockedKeywords,
    prefs,
  });
  const personalization = await getNewsPersonalizationSignals(householdId);

  const rankedClusters = rankBriefingClusters({
    candidates,
    interests,
    blockedKeywords,
    blockedCategories,
    personalization,
  });

  const generatedAt = new Date().toISOString();
  const storyCards = await generateStoryCards({
    rankedClusters,
    summaryLanguage: prefs.summary_language,
    generatedAt,
  });
  await persistStoryCards(storyCards);

  return {
    storyCards,
    generatedAt,
  };
}
