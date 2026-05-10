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

