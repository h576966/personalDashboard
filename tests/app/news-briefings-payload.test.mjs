import assert from "node:assert/strict";
import test from "node:test";
import {
  getBriefingGetPayload,
  latestEnabledTopicUpdatedAt,
  shouldRefreshBriefingForTopics,
} from "../../src/app/api/news/briefings/payload.mjs";

test("news briefings GET payload returns empty source when cache is missing", () => {
  const payload = getBriefingGetPayload([]);
  assert.deepEqual(payload, { briefing: null, source: "empty" });
});

test("news briefings GET payload returns cache source with first generatedAt", () => {
  const storyCards = [
    { id: "story_1", generatedAt: "2026-05-10T10:00:00.000Z" },
    { id: "story_2", generatedAt: "2026-05-10T10:00:00.000Z" },
  ];

  const payload = getBriefingGetPayload(storyCards, "2026-05-10T11:00:00.000Z");
  assert.equal(payload.source, "cache");
  assert.deepEqual(payload.briefing?.storyCards, storyCards);
  assert.equal(payload.briefing?.generatedAt, "2026-05-10T10:00:00.000Z");
});

test("news briefings GET payload falls back generatedAt when first card is missing timestamp", () => {
  const storyCards = [{ id: "story_1" }];
  const payload = getBriefingGetPayload(storyCards, "2026-05-10T11:00:00.000Z");

  assert.equal(payload.source, "cache");
  assert.equal(payload.briefing?.generatedAt, "2026-05-10T11:00:00.000Z");
});

test("latestEnabledTopicUpdatedAt ignores disabled and invalid topic timestamps", () => {
  const latest = latestEnabledTopicUpdatedAt([
    { enabled: true, updatedAt: "2026-05-10T09:00:00.000Z" },
    { enabled: false, updatedAt: "2026-05-10T12:00:00.000Z" },
    { enabled: true, updatedAt: "not-a-date" },
  ]);

  assert.equal(latest, Date.parse("2026-05-10T09:00:00.000Z"));
});

test("briefing refreshes when there is no cache so stored topics can fetch news", () => {
  assert.equal(
    shouldRefreshBriefingForTopics([], [
      { enabled: true, updatedAt: "2026-05-10T09:00:00.000Z" },
    ]),
    true,
  );
});

test("briefing refreshes when enabled topics changed after cached story cards", () => {
  const storyCards = [{ id: "story_1", generatedAt: "2026-05-10T09:00:00.000Z" }];
  const topics = [{ enabled: true, updatedAt: "2026-05-10T09:30:00.000Z" }];

  assert.equal(shouldRefreshBriefingForTopics(storyCards, topics), true);
});

test("briefing keeps cache when stored topics are older than cached story cards", () => {
  const storyCards = [{ id: "story_1", generatedAt: "2026-05-10T10:00:00.000Z" }];
  const topics = [{ enabled: true, updatedAt: "2026-05-10T09:30:00.000Z" }];

  assert.equal(shouldRefreshBriefingForTopics(storyCards, topics), false);
});
