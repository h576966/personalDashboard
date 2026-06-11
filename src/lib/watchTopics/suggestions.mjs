const MAX_QUERIES = 6;
const MAX_SOURCE_DOMAINS = 6;
const DOMAIN_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

function uniqueStrings(values, limit) {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const trimmed = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(trimmed);
    if (output.length >= limit) break;
  }

  return output;
}

export function normalizeDomain(value) {
  const trimmed = String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .replace(/\s+/g, "");

  if (!trimmed) return "";

  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return DOMAIN_PATTERN.test(hostname) ? hostname : "";
  } catch {
    const domain = trimmed
      .replace(/^https?:\/\//i, "")
      .split(/[/?#]/)[0]
      .toLowerCase()
      .replace(/^www\./, "");

    return DOMAIN_PATTERN.test(domain) ? domain : "";
  }
}

export function fallbackWatchTopicSuggestion(topic) {
  const name = String(topic ?? "").replace(/\s+/g, " ").trim();

  return {
    name,
    queries: name ? [name] : [],
    sourceDomains: [],
  };
}

export function normalizeWatchTopicSuggestion(topic, raw) {
  const fallback = fallbackWatchTopicSuggestion(topic);
  const source = raw && typeof raw === "object" ? raw : {};
  const name = typeof source.name === "string" && source.name.trim()
    ? source.name.replace(/\s+/g, " ").trim()
    : fallback.name;

  const rawQueries = Array.isArray(source.queries) ? source.queries : [];
  const queries = uniqueStrings([fallback.name, ...rawQueries], MAX_QUERIES);
  const rawDomains = Array.isArray(source.sourceDomains) ? source.sourceDomains : [];
  const sourceDomains = uniqueStrings(
    rawDomains.map((domain) => normalizeDomain(domain)).filter(Boolean),
    MAX_SOURCE_DOMAINS,
  );

  return {
    name,
    queries: queries.length > 0 ? queries : fallback.queries,
    sourceDomains,
  };
}

export function parseWatchTopicSuggestionContent(topic, content) {
  try {
    const jsonMatch = String(content ?? "").match(/\{[\s\S]*\}/);
    const json = jsonMatch ? jsonMatch[0] : content;
    return normalizeWatchTopicSuggestion(topic, JSON.parse(json));
  } catch {
    return fallbackWatchTopicSuggestion(topic);
  }
}
