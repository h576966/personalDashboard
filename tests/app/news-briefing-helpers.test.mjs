import assert from "node:assert/strict";
import test from "node:test";
import {
  isLikelyStoryImageUrl,
  shouldShowStoryImage,
  sourceForUrl,
  sourceLabel,
} from "../../src/app/newsBriefing/helpers.mjs";

test("sourceLabel falls back to hostname when source is missing", () => {
  assert.equal(sourceLabel({ title: "Reuters", url: "https://www.reuters.com/world" }), "reuters.com");
  assert.equal(sourceLabel({ title: "Known", url: "not-a-url", source: "Known Source" }), "Known Source");
});

test("sourceForUrl finds matching story source by URL", () => {
  const story = {
    sources: [
      { url: "https://a.com/1", title: "A" },
      { url: "https://b.com/2", title: "B" },
    ],
  };

  assert.equal(sourceForUrl(story, "https://b.com/2")?.title, "B");
  assert.equal(sourceForUrl(story, "https://c.com/3"), undefined);
});

test("isLikelyStoryImageUrl rejects non-https and likely logos", () => {
  assert.equal(isLikelyStoryImageUrl(undefined), false);
  assert.equal(isLikelyStoryImageUrl("http://example.com/story.jpg"), false);
  assert.equal(isLikelyStoryImageUrl("https://cdn.example.com/logo.png"), false);
  assert.equal(isLikelyStoryImageUrl("https://cdn.example.com/images/story-photo.jpg"), true);
});

test("shouldShowStoryImage respects interest/category and image guard", () => {
  const baseStory = {
    matchedInterests: ["Tech News"],
    imageUrl: "https://img.example.com/story.jpg",
  };
  assert.equal(shouldShowStoryImage(baseStory), true);
  assert.equal(
    shouldShowStoryImage({
      matchedInterests: ["Nordic economy and society"],
      imageUrl: "https://img.example.com/story.jpg",
    }),
    false,
  );
  assert.equal(
    shouldShowStoryImage({
      matchedInterests: ["Tech News"],
      imageUrl: "https://img.example.com/logo.png",
    }),
    false,
  );
});

