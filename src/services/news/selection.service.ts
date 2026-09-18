import type { ClassifiedNewsArticle } from "@/types/news";

interface SelectableArticle extends ClassifiedNewsArticle {
  relevanceScore: number;
  importanceScore: number;
  sourceQualityScore: number;
  freshnessScore: number;
  popularityScore: number;
  diversityScore: number;
  audienceValueScore: number;
  finalScore: number;
}
export interface SelectedNewsArticle extends SelectableArticle {
  rank: number;
  isSelected: boolean;
}

const MAX_ARTICLES = 10;
const MAX_PER_COMPANY = 3;
const MAX_PER_CATEGORY = 4;
const MIN_RELEVANCE_SCORE = 15;

function canSelectArticle(
  article: SelectableArticle,
  companyCounts: Map<string, number>,
  categoryCounts: Map<string, number>,
): boolean {
  const company = article.company;
  const category = article.category;

  if (company && (companyCounts.get(company) ?? 0) >= MAX_PER_COMPANY) {
    return false;
  }

  if (category && (categoryCounts.get(category) ?? 0) >= MAX_PER_CATEGORY) {
    return false;
  }

  return true;
}

function addArticle(
  article: SelectableArticle,
  selected: SelectedNewsArticle[],
  companyCounts: Map<string, number>,
  categoryCounts: Map<string, number>,
): void {
  selected.push({
    ...article,
    rank: selected.length + 1,
    isSelected: true,
  });

  if (article.company) {
    companyCounts.set(
      article.company,
      (companyCounts.get(article.company) ?? 0) + 1,
    );
  }

  if (article.category) {
    categoryCounts.set(
      article.category,
      (categoryCounts.get(article.category) ?? 0) + 1,
    );
  }
}

export function selectTopArticles(
  articles: SelectableArticle[],
): SelectedNewsArticle[] {
  const companyCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  const selected: SelectedNewsArticle[] = [];
  const selectedIds = new Set<string>();

  /*
   * Pass 1:
   * Prefer articles with strong relevance.
   */
  for (const article of articles) {
    if (selected.length >= MAX_ARTICLES) {
      break;
    }

    if (article.relevanceScore < MIN_RELEVANCE_SCORE) {
      continue;
    }

    if (!canSelectArticle(article, companyCounts, categoryCounts)) {
      continue;
    }

    addArticle(article, selected, companyCounts, categoryCounts);

    selectedIds.add(article.originalUrl);
  }

  /*
   * Pass 2:
   * If we don't have 10 stories, fill the remaining
   * slots with the best remaining representatives.
   */
  if (selected.length < MAX_ARTICLES) {
    for (const article of articles) {
      if (selected.length >= MAX_ARTICLES) {
        break;
      }

      if (selectedIds.has(article.originalUrl)) {
        continue;
      }

      if (!canSelectArticle(article, companyCounts, categoryCounts)) {
        continue;
      }

      addArticle(article, selected, companyCounts, categoryCounts);

      selectedIds.add(article.originalUrl);
    }
  }

  return selected;
}
