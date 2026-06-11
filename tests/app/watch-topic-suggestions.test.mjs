import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeDomain,
  normalizeWatchTopicSuggestion,
  parseWatchTopicSuggestionContent,
} from "../../src/lib/watchTopics/suggestions.mjs";

test("normalizeDomain converts URLs to plain lowercase domains", () => {
  assert.equal(normalizeDomain("https://www.MacRumors.com/roundup/mac-studio/?utm=x"), "macrumors.com");
  assert.equal(normalizeDomain("9to5mac.com/apple-silicon"), "9to5mac.com");
  assert.equal(normalizeDomain("not a domain"), "");
});

test("normalizeWatchTopicSuggestion dedupes, caps, and keeps topic query", () => {
  const suggestion = normalizeWatchTopicSuggestion("M5 Mac Studio Ultra", {
    name: "M5 Mac Studio Ultra",
    queries: [
      "M5 Mac Studio Ultra",
      "M5 Mac Studio release date",
      "M5 Ultra chip",
      "Mac Studio M5 rumors",
      "Apple M5 desktop",
      "M5 Studio benchmark",
      "Ignored extra query",
    ],
    sourceDomains: [
      "https://www.macrumors.com/roundup/mac-studio/",
      "macrumors.com",
      "9to5mac.com",
      "apple.com",
      "theverge.com",
      "bloomberg.com",
      "arstechnica.com",
      "ignored.example",
    ],
  });

  assert.equal(suggestion.queries.length, 6);
  assert.equal(suggestion.queries[0], "M5 Mac Studio Ultra");
  assert.deepEqual(suggestion.sourceDomains, [
    "macrumors.com",
    "9to5mac.com",
    "apple.com",
    "theverge.com",
    "bloomberg.com",
    "arstechnica.com",
  ]);
});

test("parseWatchTopicSuggestionContent falls back safely on invalid AI output", () => {
  assert.deepEqual(parseWatchTopicSuggestionContent("Local AI", "not json"), {
    name: "Local AI",
    queries: ["Local AI"],
    sourceDomains: [],
  });
});
