import { extractDomain, isBoosted, qualityHeuristics } from "./quality.mjs";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "for",
  "from",
  "how",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

export function searchTerms(query) {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
}

function recencyBonus(age) {
  if (!age) return 0;

  const lower = age.toLowerCase();
  if (/\b(hour|hours|minute|minutes|today)\b/.test(lower)) return 2;
  if (/\b(day|days|yesterday)\b/.test(lower)) return 1;
  if (/\b(month|months|year|years)\b/.test(lower)) return -1;
  return 0;
}

export function scoreResult(result, query) {
  const terms = searchTerms(query);
  const normalizedQuery = terms.join(" ");
  const titleLower = result.title.toLowerCase();
  const descriptionLower = result.description.toLowerCase();
  const domain = extractDomain(result.url);
  const urlLower = result.url.toLowerCase();

  let score = 0;

  if (normalizedQuery && titleLower.includes(normalizedQuery)) {
    score += 6;
  }

  if (normalizedQuery && descriptionLower.includes(normalizedQuery)) {
    score += 3;
  }

  for (const term of terms) {
    if (titleLower.includes(term)) {
      score += 3;
    }
    if (descriptionLower.includes(term)) {
      score += 1;
    }
    if (domain.includes(term)) {
      score += 2;
    } else if (urlLower.includes(term)) {
      score += 1;
    }
  }

  if (result.description.length < 50) {
    score -= 1;
  }

  score += qualityHeuristics(result);
  score += recencyBonus(result.age);

  if (isBoosted(result.url)) {
    score += 3;
  }

  return { ...result, score };
}

export function diversifyResults(results, maxPerDomain = 2) {
  const domainCounts = new Map();
  const primary = [];
  const overflow = [];

  for (const result of results) {
    const domain = extractDomain(result.url) || result.url;
    const count = domainCounts.get(domain) ?? 0;

    if (count < maxPerDomain) {
      primary.push(result);
      domainCounts.set(domain, count + 1);
    } else {
      overflow.push(result);
    }
  }

  return [...primary, ...overflow];
}

export function shouldRewriteQuery(query, results) {
  const trimmed = query.trim();
  const terms = searchTerms(trimmed);

  if (terms.length <= 2) return false;
  if (/["]|(?:^|\s)(site|filetype|intitle|inurl):/i.test(trimmed)) return false;
  if (/https?:\/\/|\w+\.\w{2,}/.test(trimmed)) return false;

  if (results.length < 4) return true;
  const topScore = results[0]?.score ?? 0;
  const averageTopScore =
    results.slice(0, 3).reduce((total, result) => total + result.score, 0) /
    Math.max(results.slice(0, 3).length, 1);

  return topScore < 3 || averageTopScore < 2;
}

export function isBetterResultSet(candidate, current) {
  if (candidate.length >= current.length + 3) return true;
  if ((candidate[0]?.score ?? 0) >= (current[0]?.score ?? 0) + 3) return true;
  return false;
}
