#!/usr/bin/env node

/**
 * CLI script to trigger a news fetch.
 *
 * Usage:
 *   node scripts/fetch-news.mjs
 *   node scripts/fetch-news.mjs http://localhost:3000
 *
 * Designed to be called from a cron job or task scheduler.
 */

const BASE_URL = process.argv[2] || "http://localhost:3000";

async function main() {
  console.log(`[news:fetch] Calling ${BASE_URL}/api/news/fetch ...`);

  const start = Date.now();

  try {
    const res = await fetch(`${BASE_URL}/api/news/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      console.error(`[news:fetch] Failed (${elapsed}s): ${err.error?.message || res.statusText}`);
      process.exit(1);
    }

    const data = await res.json();
    console.log(
      `[news:fetch] Done (${elapsed}s): ` +
      `fetched ${data.totalFetched} raw, ` +
      `${data.totalAfterDedup} after dedup, ` +
      `${data.totalAfterFilter} in briefing.`,
    );

    if (data.topicCounts && Object.keys(data.topicCounts).length > 0) {
      console.log("[news:fetch] Per-topic breakdown:");
      for (const [topic, count] of Object.entries(data.topicCounts)) {
        console.log(`  ${topic}: ${count} items`);
      }
    }
  } catch (err) {
    console.error(`[news:fetch] Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
