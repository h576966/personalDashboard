import { isBlocked, isBoosted, extractDomain } from "@/lib/search/quality";
import type { NewsTopic } from "@/lib/db/topics";

export interface ScoredNewsItem {
  title: string;
  url: string;
  description: string;
  source: string;
  score: number;
  titleHash: string;
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function computeTitleHash(title: string): string {
  const normalized = normalizeTitle(title);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function isRecent(age?: string): boolean {
  if (!age) return true; // assume recent if no age given
  // Brave returns age like "2024-01-15" or "2 hours ago" or "3 days ago"
  if (/^\d{4}-\d{2}-\d{2}$/.test(age)) {
    const date = new Date(age);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }
  if (age.includes("hour") || age.includes("day")) {
    const num = parseInt(age, 10);
    if (age.includes("hour")) return num <= 48;
    if (age.includes("day")) return num <= 7;
  }
  return true;
}

function detectCommercialPatterns(title: string, description: string): boolean {
  const commercial = [
    "sponsored", "ad", "promoted", "affiliate", "discount", "coupon",
    "buy now", "limited time", "free shipping", "click here",
  ];
  const text = `${title} ${description}`.toLowerCase();
  return commercial.some((p) => text.includes(p));
}

function containsKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export function scoreNewsItem(
  result: { title: string; url: string; description: string; age?: string },
  topic: NewsTopic,
): ScoredNewsItem {
  let score = 0;
  const titleLower = result.title.toLowerCase();
  const descLower = result.description.toLowerCase();
  const combined = `${titleLower} ${descLower}`;
  const domain = extractDomain(result.url);

  // --- Positive signals ---

  // Query/title match: +30 if title contains any query term
  for (const query of topic.queries) {
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
    const matchCount = terms.filter((t) => titleLower.includes(t)).length;
    if (matchCount > 0) {
      score += 30;
      break; // +30 once per topic query match
    }
  }

  // Preferred domain: +20
  if (topic.preferredSources.length > 0) {
    if (topic.preferredSources.some((s) => domain.includes(s.toLowerCase()))) {
      score += 20;
    }
  }

  // Recent: +15
  if (isRecent(result.age)) {
    score += 15;
  }

  // Country/language match: +15 if topic has country/language configured
  if (topic.country || topic.language) {
    // Brave doesn't always return country/lang per result, so this is best-effort
    // We check the domain TLD as a proxy for country
    if (topic.country && domain.endsWith(`.${topic.country.toLowerCase()}`)) {
      score += 15;
    }
  }

  // Trusted source (boosted domain): +10
  if (isBoosted(result.url)) {
    score += 10;
  }

  // Required keyword match: +15 per matching keyword
  if (topic.requiredKeywords.length > 0) {
    const reqMatches = topic.requiredKeywords.filter((k) =>
      containsKeyword(combined, [k]),
    ).length;
    score += reqMatches * 15;
  }

  // --- Negative signals ---

  // Blocked keyword: -40 per keyword
  if (topic.blockedKeywords.length > 0) {
    const blockedMatches = topic.blockedKeywords.filter((k) =>
      containsKeyword(combined, [k]),
    ).length;
    score -= blockedMatches * 40;
  }

  // Blocked domain: -50
  if (isBlocked(result.url)) {
    score -= 50;
  }

  // Weak relevance (title too short or generic): -30
  if (result.title.length < 20) {
    score -= 30;
  }

  // Duplicate-ish signal (same source, very similar title): -30 (handled at dedup level)
  // This is detected in the deduplication step, not here

  // Commercial pattern: -25
  if (detectCommercialPatterns(result.title, result.description)) {
    score -= 25;
  }

  return {
    title: result.title,
    url: result.url,
    description: result.description,
    source: domain,
    score,
    titleHash: computeTitleHash(result.title),
  };
}
