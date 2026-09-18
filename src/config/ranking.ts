export const rankingConfig = {
  weights: {
    relevance: 30,
    importance: 30,
    sourceQuality: 15,
    audienceValue: 25,

    // Diagnostic / future signals.
    // These are currently not included in finalScore.
    freshness: 0,
    popularity: 0,
    diversity: 0,
  },

  limits: {
    maxArticlesPerCompany: 3,
    maxArticlesPerCategory: 4,
  },
};
