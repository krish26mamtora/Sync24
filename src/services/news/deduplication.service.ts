import type { NormalizedNewsArticle } from "@/types/news";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function deduplicateArticles(
  articles: NormalizedNewsArticle[],
): NormalizedNewsArticle[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  const uniqueArticles: NormalizedNewsArticle[] = [];

  for (const article of articles) {
    const normalizedUrl = article.originalUrl.trim().toLowerCase();
    const normalizedTitle = normalizeTitle(article.title);

    if (seenUrls.has(normalizedUrl)) {
      continue;
    }

    if (seenTitles.has(normalizedTitle)) {
      continue;
    }

    seenUrls.add(normalizedUrl);
    seenTitles.add(normalizedTitle);

    uniqueArticles.push(article);
  }

  return uniqueArticles;
}
