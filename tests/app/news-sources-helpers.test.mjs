import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SOURCES,
  asStringArray,
  hasUniqueDomains,
  hasValidSourceRanges,
  rowToNewsSource,
  sourceUrl,
} from "../../src/lib/db/newsSources.shared.mjs";

test("asStringArray keeps only string values", () => {
  assert.deepEqual(asStringArray(["a", 1, "b", null, {}]), ["a", "b"]);
  assert.deepEqual(asStringArray("nope"), []);
});

test("rowToNewsSource maps db row fields into app shape", () => {
  const source = rowToNewsSource({
    id: "source-1",
    name: "Reuters",
    domain: "reuters.com",
    tags: ["global", "politics"],
    quality_score: 0.91,
    default_enabled: true,
    user_enabled: false,
    region: "global",
    language: "en",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  });

  assert.equal(source.url, sourceUrl("reuters.com"));
  assert.equal(source.category, "global");
  assert.equal(source.priority, 91);
  assert.equal(source.enabled, false);
  assert.equal(source.isDefault, true);
});

test("default sources satisfy uniqueness and quality assumptions", () => {
  assert.equal(hasUniqueDomains(DEFAULT_SOURCES), true);
  assert.equal(hasValidSourceRanges(DEFAULT_SOURCES), true);
  assert.ok(DEFAULT_SOURCES.length >= 30);
});

