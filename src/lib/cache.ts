import type { ScoredResult } from "./search";
import {
  CACHE_CLEANUP_INTERVAL_MS,
  CACHE_MAX_SIZE,
  CACHE_TTL_MS,
} from "./config";

export interface CacheEntry {
  results: ScoredResult[];
  summary?: string;
  suggestions?: string[];
  rewrittenQuery?: string;
  timestamp: number;
}

const store = new Map<string, CacheEntry>();
let lastCleanup = 0;

function cleanupExpiredEntries(now = Date.now()): void {
  if (now - lastCleanup < CACHE_CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      store.delete(key);
    }
  }
}

export const searchCache = {
  get(key: string): CacheEntry | undefined {
    cleanupExpiredEntries();

    const entry = store.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      store.delete(key);
      return undefined;
    }

    return entry;
  },

  set(key: string, entry: CacheEntry): void {
    cleanupExpiredEntries(entry.timestamp);

    // Evict oldest entry if at capacity
    if (store.size >= CACHE_MAX_SIZE) {
      const oldestKey = store.keys().next().value;
      if (oldestKey !== undefined) {
        store.delete(oldestKey);
      }
    }

    store.set(key, entry);
  },

  clear(): void {
    store.clear();
  },
};
