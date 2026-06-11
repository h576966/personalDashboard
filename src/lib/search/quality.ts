import {
  BLOCKED_DOMAINS as BLOCKED_DOMAINS_IMPL,
  BOOSTED_DOMAINS as BOOSTED_DOMAINS_IMPL,
  extractDomain as extractDomainImpl,
  isBlocked as isBlockedImpl,
  isBoosted as isBoostedImpl,
  qualityHeuristics as qualityHeuristicsImpl,
} from "./quality.mjs";

export interface QualifiableResult {
  title: string;
  description: string;
  url: string;
}

export const BLOCKED_DOMAINS = BLOCKED_DOMAINS_IMPL as Set<string>;
export const BOOSTED_DOMAINS = BOOSTED_DOMAINS_IMPL as Set<string>;

export function extractDomain(url: string): string {
  return extractDomainImpl(url) as string;
}

export function isBlocked(url: string): boolean {
  return isBlockedImpl(url) as boolean;
}

export function isBoosted(url: string): boolean {
  return isBoostedImpl(url) as boolean;
}

export function qualityHeuristics(result: QualifiableResult): number {
  return qualityHeuristicsImpl(result) as number;
}
