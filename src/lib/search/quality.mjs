export const BLOCKED_DOMAINS = new Set([
  "pinterest.com",
  "pinterest.at",
  "pinterest.ca",
  "pinterest.co.uk",
  "pinterest.de",
  "pinterest.es",
  "pinterest.fr",
  "pinterest.jp",
  "pinterest.mx",
  "pinterest.nz",
  "pinterest.se",
  "quora.com",
  "answers.com",
  "answerbag.com",
  "buzzfeed.com",
  "buzzfeednews.com",
  "howtogeek.com",
  "tiktok.com",
  "tumblr.com",
  "expertreviews.co.uk",
  "tomsguide.com",
]);

export const BOOSTED_DOMAINS = new Set([
  "wikipedia.org",
  "github.com",
  "stackoverflow.com",
  "stackexchange.com",
  "serverfault.com",
  "superuser.com",
  "askubuntu.com",
  "developer.mozilla.org",
  "mdn.io",
  "arxiv.org",
  "npmjs.com",
  "crates.io",
  "docs.python.org",
  "docs.rs",
  "pkg.go.dev",
  "react.dev",
  "nextjs.org",
  "nodejs.org",
  "deno.com",
  "tailwindcss.com",
  "*.gov",
  "*.edu",
  "*.ac.uk",
]);

function hasWildcardSuffix(domain, hostname) {
  if (!domain.startsWith("*.")) return false;
  const suffix = domain.slice(1);
  return hostname.endsWith(suffix);
}

export function extractDomain(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isBlocked(url) {
  const hostname = extractDomain(url);
  if (!hostname) return false;

  if (BLOCKED_DOMAINS.has(hostname)) return true;

  for (const domain of BLOCKED_DOMAINS) {
    if (hasWildcardSuffix(domain, hostname)) return true;
  }

  return false;
}

export function isBoosted(url) {
  const hostname = extractDomain(url);
  if (!hostname) return false;

  if (BOOSTED_DOMAINS.has(hostname)) return true;

  for (const domain of BOOSTED_DOMAINS) {
    if (hasWildcardSuffix(domain, hostname)) return true;
  }

  return false;
}

export function qualityHeuristics(result) {
  let bonus = 0;

  if (result.description.length > 200) {
    bonus += 2;
  } else if (result.description.length > 100) {
    bonus += 1;
  }

  if (result.title.length < 10) {
    bonus -= 1;
  }

  try {
    const url = new URL(result.url);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 5) {
      bonus -= 1;
    }
  } catch {
    // Malformed URL, no penalty.
  }

  return bonus;
}
