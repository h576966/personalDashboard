import assert from "node:assert/strict";
import test from "node:test";
import { getBriefingGetPayload } from "../../src/app/api/news/briefings/payload.mjs";

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

