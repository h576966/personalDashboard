import type { ScoredResult } from "./search";
import {
  CACHE_AI_SUMMARY_TTL_MS,
  CACHE_CLEANUP_INTERVAL_MS,
  CACHE_MAX_SIZE,
  CACHE_STALE_TTL_MS,
  CACHE_TTL_MS,
} from "./config";

interface TimedCacheEntry {
  timestamp: number;
  ttlMs?: number;
  staleTtlMs?: number;
}

export interface CacheEntry extends TimedCacheEntry {
  results: ScoredResult[];
  rewrittenQuery?: string;
}

export interface SummaryCacheEntry extends TimedCacheEntry {
  summary: string;
  suggestions: string[];
}

interface CacheOptions {
  allowStale?: boolean;
}

function maxAge(entry: TimedCacheEntry, allowStale: boolean): number {
  return (entry.ttlMs ?? CACHE_TTL_MS) + (allowStale ? (entry.staleTtlMs ?? 0) : 0);
}

function createMemoryCache<TEntry extends TimedCacheEntry>(
  defaults: { ttlMs: number; staleTtlMs?: number },
) {
  const store = new Map<string, TEntry>();
  let lastCleanup = 0;

  function cleanupExpiredEntries(now = Date.now()): void {
    if (now - lastCleanup < CACHE_CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    for (const [key, entry] of store) {
      if (now - entry.timestamp > maxAge(entry, true)) {
        store.delete(key);
      }
    }
  }

  return {
    get(key: string, options: CacheOptions = {}): TEntry | undefined {
      const now = Date.now();
      cleanupExpiredEntries(now);

      const entry = store.get(key);
      if (!entry) return undefined;

      const age = now - entry.timestamp;
      if (age > maxAge(entry, options.allowStale === true)) {
        if (age > maxAge(entry, true)) {
          store.delete(key);
        }
        return undefined;
      }

      return entry;
    },

    set(key: string, entry: TEntry): void {
      cleanupExpiredEntries(entry.timestamp);

      if (store.size >= CACHE_MAX_SIZE) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) {
          store.delete(oldestKey);
        }
      }

      store.set(key, {
        ...entry,
        ttlMs: entry.ttlMs ?? defaults.ttlMs,
        staleTtlMs: entry.staleTtlMs ?? defaults.staleTtlMs,
      });
    },

    clear(): void {
      store.clear();
    },
  };
}

export const searchCache = createMemoryCache<CacheEntry>({
  ttlMs: CACHE_TTL_MS,
  staleTtlMs: CACHE_STALE_TTL_MS,
});

export const summaryCache = createMemoryCache<SummaryCacheEntry>({
  ttlMs: CACHE_AI_SUMMARY_TTL_MS,
  staleTtlMs: CACHE_STALE_TTL_MS,
});
