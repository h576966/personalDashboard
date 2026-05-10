import assert from "node:assert/strict";
import test from "node:test";
import { rankClusterSelectionImpl, scoreClusterImpl } from "../../src/lib/news/ranking.mjs";

function article(overrides = {}) {
  return {
    title: "Story",
    url: "https://example.com/story",
    source: "example.com",
    description: "Summary",
    sourceQuality: 0.8,
    regionalRelevance: 0.2,
    freshness: 0.9,
    watchConfidence: 0,
    ...overrides,
  };
}

function cluster(id, overrides = {}) {
  return {
    id,
    articles: [article()],
    score: 0,
    matchedInterests: ["Tech"],
    isWatchUpdate: false,
    ...overrides,
  };
}

const baseInput = {
  interests: [{ name: "Tech" }, { name: "Nordic" }],
  blockedKeywords: [],
  blockedCategories: [],
  personalization: {
    feedbackAffinityByStory: new Map(),
    feedbackAffinityByInterest: new Map(),
    savedUrlStatusByUrl: new Map(),
    savedHostAffinityByHost: new Map(),
  },
};

test("scoreClusterImpl rewards positive signals and penalizes blocked signals", () => {
  const positive = scoreClusterImpl(cluster("positive"), {
    ...baseInput,
    personalization: {
      ...baseInput.personalization,
      feedbackAffinityByStory: new Map([["positive", 0.8]]),
      savedUrlStatusByUrl: new Map([["https://example.com/story", "read"]]),
    },
  });

  const blocked = scoreClusterImpl(
    cluster("blocked", {
      articles: [article({ title: "Gossip update", description: "gossip and rumor" })],
      matchedInterests: ["gossip"],
    }),
    {
      ...baseInput,
      blockedKeywords: ["gossip"],
      blockedCategories: ["gossip"],
    },
  );

  assert.ok(positive.score > 0);
  assert.ok(blocked.score < 0);
});

test("rankClusterSelectionImpl sorts descending and caps at five items", () => {
  const clusters = Array.from({ length: 6 }, (_, index) =>
    cluster(`story-${index}`, {
      articles: [
        article({
          sourceQuality: 0.5 + index * 0.05,
          freshness: 0.6 + index * 0.03,
          regionalRelevance: index * 0.05,
          url: `https://example.com/story-${index}`,
        }),
      ],
    })
  );

  const ranked = rankClusterSelectionImpl(clusters, baseInput);
  assert.equal(ranked.length, 5);
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i - 1].score >= ranked[i].score);
  }
});

