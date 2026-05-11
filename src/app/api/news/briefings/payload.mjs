export function getBriefingGetPayload(storyCards, nowIso = new Date().toISOString()) {
  if (storyCards.length > 0) {
    return {
      briefing: {
        storyCards,
        generatedAt: storyCards[0]?.generatedAt ?? nowIso,
      },
      source: "cache",
    };
  }

  return { briefing: null, source: "empty" };
}

export function latestEnabledTopicUpdatedAt(topics) {
  return topics
    .filter((topic) => topic?.enabled !== false)
    .map((topic) => Date.parse(topic?.updatedAt ?? ""))
    .filter((timestamp) => Number.isFinite(timestamp))
    .reduce((latest, timestamp) => Math.max(latest, timestamp), 0);
}

export function shouldRefreshBriefingForTopics(storyCards, topics) {
  if (storyCards.length === 0) return true;

  const latestTopicUpdatedAt = latestEnabledTopicUpdatedAt(topics);
  if (latestTopicUpdatedAt === 0) return false;

  const cacheGeneratedAt = Date.parse(storyCards[0]?.generatedAt ?? "");
  if (!Number.isFinite(cacheGeneratedAt)) return true;

  return latestTopicUpdatedAt > cacheGeneratedAt;
}
