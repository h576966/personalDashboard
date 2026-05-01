import type { ScoredResult } from "./search";

interface CacheEntry {
  results: ScoredResult[];
  timestamp: number;
}

const MAX_SIZE = 500;
const TTL_MS = 60_000;
const CLEANUP_INTERVAL_MS = 300_000;

const store = new Map<string, CacheEntry>();
let cleanupStarted = false;

function startCleanup(): void {
  if (cleanupStarted) return;
  cleanupStarted = true;

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.timestamp > TTL_MS) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

startCleanup();

export const searchCache = {
  get(key: string): ScoredResult[] | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > TTL_MS) {
      store.delete(key);
      return undefined;
    }

    return entry.results;
  },

  set(key: string, results: ScoredResult[]): void {
    // Evict oldest entry if at capacity
    if (store.size >= MAX_SIZE) {
      const oldestKey = store.keys().next().value;
      if (oldestKey !== undefined) {
        store.delete(oldestKey);
      }
    }

    store.set(key, { results, timestamp: Date.now() });
  },

  clear(): void {
    store.clear();
  },
};
