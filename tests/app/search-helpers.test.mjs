import assert from "node:assert/strict";
import test from "node:test";
import { filterResults } from "../../src/lib/search/filter.mjs";
import {
  diversifyResults,
  scoreResult,
  shouldRewriteQuery,
} from "../../src/lib/search/score.mjs";
import { searchNotes } from "../../src/lib/search/notes.mjs";

test("filterResults canonicalizes URLs and removes tracking duplicates", () => {
  const results = filterResults([
    {
      title: "React docs",
      url: "https://www.react.dev/reference/react?utm_source=newsletter#intro",
      description: "<b>React</b> reference",
    },
    {
      title: "React docs duplicate",
      url: "https://react.dev/reference/react",
      description: "Duplicate",
    },
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].url, "https://react.dev/reference/react");
  assert.equal(results[0].description, "React reference");
});

test("scoreResult boosts exact phrase, domain matches, and recent results", () => {
  const scored = scoreResult(
    {
      title: "Next.js caching guide",
      url: "https://nextjs.org/docs/app/building-your-application/caching",
      description: "The official Next.js caching guide explains cache behavior.",
      age: "2 hours ago",
    },
    "Next.js caching",
  );

  assert.ok(scored.score >= 15);
});

test("shouldRewriteQuery only triggers for weak non-exact searches", () => {
  assert.equal(shouldRewriteQuery('"exact phrase"', []), false);
  assert.equal(shouldRewriteQuery("nextjs", []), false);
  assert.equal(shouldRewriteQuery("how to plan household chores better", []), true);
});

test("diversifyResults moves repeated domains behind varied sources", () => {
  const input = [
    { title: "A", description: "", url: "https://example.com/a", score: 10 },
    { title: "B", description: "", url: "https://example.com/b", score: 9 },
    { title: "C", description: "", url: "https://example.com/c", score: 8 },
    { title: "D", description: "", url: "https://other.com/d", score: 7 },
  ];

  assert.deepEqual(diversifyResults(input).map((result) => result.title), ["A", "B", "D", "C"]);
});

test("searchNotes ranks title and content matches", () => {
  const results = searchNotes(
    [
      {
        id: "1",
        title: "Meal plan",
        content: "Remember simple weeknight dinner ideas.",
        updated_at: "2026-01-01",
      },
      {
        id: "2",
        title: "Car service",
        content: "Book yearly appointment.",
        updated_at: "2026-01-02",
      },
    ],
    "meal dinner",
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].id, "1");
  assert.ok(results[0].description.includes("dinner"));
});
