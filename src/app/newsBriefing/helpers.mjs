const NON_VISUAL_CATEGORIES = new Set(["Nordic economy and society", "Geopolitics"]);
const NON_STORY_IMAGE_TERMS = [
  "logo",
  "icon",
  "favicon",
  "avatar",
  "profile",
  "placeholder",
  "default",
  "brand",
  "sprite",
];

export function sourceLabel(source) {
  try {
    return source.source || new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return source.source || source.url;
  }
}

export function sourceForUrl(story, url) {
  return story.sources.find((source) => source.url === url);
}

export function isLikelyStoryImageUrl(value) {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;

    const searchable = `${parsed.hostname} ${parsed.pathname} ${parsed.search}`.toLowerCase();
    return !NON_STORY_IMAGE_TERMS.some((term) => searchable.includes(term));
  } catch {
    return false;
  }
}

export function shouldShowStoryImage(story) {
  const hasVisualInterest = story.matchedInterests.some(
    (interest) => !NON_VISUAL_CATEGORIES.has(interest),
  );

  return hasVisualInterest && isLikelyStoryImageUrl(story.imageUrl);
}

