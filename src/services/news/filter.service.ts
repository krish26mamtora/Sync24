import type { NormalizedNewsArticle } from "@/types/news";

const CANDIDATE_WINDOW_HOURS = 24;

export function filterRecentArticles(
  articles: NormalizedNewsArticle[],
  now: Date = new Date(),
): NormalizedNewsArticle[] {
  const cutoff = new Date(
    now.getTime() - CANDIDATE_WINDOW_HOURS * 60 * 60 * 1000,
  );

  return articles.filter((article) => {
    if (!article.publishedAt) {
      return false;
    }

    const publishedAt = new Date(article.publishedAt);

    if (Number.isNaN(publishedAt.getTime())) {
      return false;
    }

    return publishedAt >= cutoff && publishedAt <= now;
  });
}
