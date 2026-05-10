function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function containsAny(text, terms) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

function containsBlockedSignal(candidate, blockedKeywords) {
  const text = `${candidate.title} ${candidate.description ?? ""} ${candidate.url}`;
  return containsAny(text, blockedKeywords);
}

export function scoreClusterImpl(cluster, input) {
  const uniqueSources = new Set(cluster.articles.map((article) => article.source));
  const sourceQuality = Math.max(...cluster.articles.map((article) => article.sourceQuality));
  const interestMatch = Math.min(cluster.matchedInterests.length / Math.max(input.interests.length, 1), 1);
  const freshness = Math.max(...cluster.articles.map((article) => article.freshness));
  const regionalRelevance = Math.max(...cluster.articles.map((article) => article.regionalRelevance));
  const feedbackAffinity = input.personalization.feedbackAffinityByStory.get(cluster.id) ?? 0;
  const interestAffinities = cluster.matchedInterests.map(
    (interest) => input.personalization.feedbackAffinityByInterest.get(interest.toLowerCase()) ?? 0,
  );
  const maxInterestAffinity = Math.max(...interestAffinities, 0);
  const minInterestAffinity = Math.min(...interestAffinities, 0);
  const netInterestAffinity = maxInterestAffinity + minInterestAffinity;
  const savedArticleAffinity = Math.max(
    ...cluster.articles.map((article) => {
      const status = input.personalization.savedUrlStatusByUrl.get(article.url);
      if (!status) return 0;
      return status === "archived" ? -1 : 1;
    }),
  );
  const savedHostAffinity = Math.max(
    ...cluster.articles.map((article) =>
      input.personalization.savedHostAffinityByHost.get(getHost(article.url).toLowerCase()) ?? 0,
    ),
  );
  const sourceDiversity = Math.min(uniqueSources.size / 3, 1);
  const watchSignificance = cluster.isWatchUpdate
    ? Math.max(...cluster.articles.map((article) => article.watchConfidence || 0.8))
    : 0;
  const blockedPenalty = cluster.articles.some((article) =>
    containsBlockedSignal(article, input.blockedKeywords),
  ) ? 1 : 0;
  const allInterestsBlocked = input.blockedCategories.length > 0 &&
    cluster.matchedInterests.length > 0 &&
    cluster.matchedInterests.every((interest) =>
      input.blockedCategories.some((cat) => interest.toLowerCase().includes(cat.toLowerCase())),
    );
  const categoryBlockedPenalty = allInterestsBlocked ? 1 : 0;
  const duplicatePenalty = cluster.articles.length > uniqueSources.size ? 0.25 : 0;

  return {
    ...cluster,
    score:
      sourceQuality * 25 +
      interestMatch * 20 +
      freshness * 15 +
      regionalRelevance * 12 +
      feedbackAffinity * 15 +
      netInterestAffinity * 15 +
      savedArticleAffinity * 8 +
      savedHostAffinity * 6 +
      sourceDiversity * 10 +
      watchSignificance * 30 -
      blockedPenalty * 100 -
      categoryBlockedPenalty * 100 -
      duplicatePenalty * 50,
  };
}

export function rankClusterSelectionImpl(clusters, input) {
  return clusters
    .map((cluster) => scoreClusterImpl(cluster, input))
    .filter((cluster) => cluster.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

