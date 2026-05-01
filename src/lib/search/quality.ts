export interface QualifiableResult {
  title: string;
  description: string;
  url: string;
}

export const BLOCKED_DOMAINS = new Set([
  // Pinterest (all country TLDs)
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
  // Q&A / content farms
  "quora.com",
  "answers.com",
  "answerbag.com",
  // Clickbait / low-effort mills
  "buzzfeed.com",
  "buzzfeednews.com",
  "howtogeek.com",
  "tiktok.com",
  "tumblr.com",
  // Thin review content
  "expertreviews.co.uk",
  "tomsguide.com",
]);

export const BOOSTED_DOMAINS = new Set([
  // Knowledge bases
  "wikipedia.org",
  // Code hosting
  "github.com",
  // Developer Q&A
  "stackoverflow.com",
  "stackexchange.com",
  "serverfault.com",
  "superuser.com",
  "askubuntu.com",
  // Web / JS docs
  "developer.mozilla.org",
  "mdn.io",
  // Academic
  "arxiv.org",
  // Package registries
  "npmjs.com",
  "crates.io",
  // Language runtimes / docs
  "docs.python.org",
  "docs.rs",
  "pkg.go.dev",
  // Frameworks
  "react.dev",
  "nextjs.org",
  "nodejs.org",
  "deno.com",
  "tailwindcss.com",
  // TLD-level wildcards (checked via suffix)
  "*.gov",
  "*.edu",
  "*.ac.uk",
]);

function hasWildcardSuffix(domain: string, hostname: string): boolean {
  if (!domain.startsWith("*.")) return false;
  const suffix = domain.slice(1); // e.g. ".gov"
  return hostname.endsWith(suffix);
}

export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname;
  } catch {
    return "";
  }
}

export function isBlocked(url: string): boolean {
  const hostname = extractDomain(url);
  if (!hostname) return false;

  if (BLOCKED_DOMAINS.has(hostname)) return true;

  // Check full domain chain for wildcard matches
  for (const domain of BLOCKED_DOMAINS) {
    if (hasWildcardSuffix(domain, hostname)) return true;
  }

  return false;
}

export function isBoosted(url: string): boolean {
  const hostname = extractDomain(url);
  if (!hostname) return false;

  if (BOOSTED_DOMAINS.has(hostname)) return true;

  // Check TLD-level wildcards like *.gov, *.edu, *.ac.uk
  for (const domain of BOOSTED_DOMAINS) {
    if (hasWildcardSuffix(domain, hostname)) return true;
  }

  return false;
}

export function qualityHeuristics(result: QualifiableResult): number {
  let bonus = 0;

  // Rich description bonus
  if (result.description.length > 200) {
    bonus += 2;
  } else if (result.description.length > 100) {
    bonus += 1;
  }

  // Short/generic title penalty
  if (result.title.length < 10) {
    bonus -= 1;
  }

  // Deep URL path penalty (5+ path segments)
  try {
    const url = new URL(result.url);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 5) {
      bonus -= 1;
    }
  } catch {
    // Malformed URL — no penalty
  }

  return bonus;
}
