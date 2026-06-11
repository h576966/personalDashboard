// ── Search ───────────────────────────────────────────────────────

export const SEARCH_MIN_COUNT = 1;
export const SEARCH_MAX_COUNT = 20;
export const SEARCH_DEFAULT_COUNT = 10;
export const SEARCH_UPSTREAM_TIMEOUT_MS = 8_000;
export const DEEPSEEK_UPSTREAM_TIMEOUT_MS = 10_000;

// ── Cache ────────────────────────────────────────────────────────

export const CACHE_MAX_SIZE = 500;
export const CACHE_TTL_MS = 30 * 60_000;
export const CACHE_CLEANUP_INTERVAL_MS = 300_000;
export const CACHE_STALE_TTL_MS = 6 * 60 * 60_000;
export const CACHE_AI_SUMMARY_TTL_MS = 30 * 60_000;

export const SEARCH_CACHE_TTL_BY_FRESHNESS = {
  pd: 60_000,
  pw: 5 * 60_000,
  pm: 15 * 60_000,
  py: 30 * 60_000,
  default: CACHE_TTL_MS,
} as const;
