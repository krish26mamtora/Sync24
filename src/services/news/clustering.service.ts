import type { ClassifiedNewsArticle } from "@/types/news";

export interface RankedNewsArticle extends ClassifiedNewsArticle {
  relevanceScore: number;
  importanceScore: number;
  sourceQualityScore: number;
  freshnessScore: number;
  popularityScore: number;
  diversityScore: number;
  audienceValueScore: number;
  finalScore: number;
}

export interface StoryCluster {
  id: string;
  articles: RankedNewsArticle[];
  representative: RankedNewsArticle;
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "for",
  "to",
  "of",
  "in",
  "on",
  "at",
  "with",
  "from",
  "by",
  "is",
  "are",
  "was",
  "were",
  "will",
  "be",
  "has",
  "have",
  "had",
  "this",
  "that",
  "its",
  "their",
  "they",
  "it",
  "as",
  "after",
  "before",
  "into",
  "over",
  "about",
]);

const IMPORTANT_ENTITIES = [
  "openai",
  "anthropic",
  "google",
  "deepmind",
  "gemini",
  "microsoft",
  "apple",
  "meta",
  "nvidia",
  "amazon",
  "aws",
  "azure",
  "intel",
  "spacex",
  "starship",
  "github",
  "kubernetes",
  "docker",
  "iphone",
  "android",
  "windows",
  "chatgpt",
  "claude",
  "llama",
  "grok",
  "gpu",
  "tpu",
  "ai agent",
  "ai agents",
  "humanoid robot",
  "humanoid robots",
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWords(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(" ")
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
}

function getImportantEntities(text: string): Set<string> {
  const normalizedText = normalizeText(text);
  const entities = new Set<string>();

  for (const entity of IMPORTANT_ENTITIES) {
    if (normalizedText.includes(entity)) {
      entities.add(entity);
    }
  }

  return entities;
}

function similarity(first: Set<string>, second: Set<string>): number {
  if (first.size === 0 || second.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const value of first) {
    if (second.has(value)) {
      intersection++;
    }
  }

  const smallerSetSize = Math.min(first.size, second.size);

  return intersection / smallerSetSize;
}

function getTitleSimilarity(
  first: RankedNewsArticle,
  second: RankedNewsArticle,
): number {
  const firstWords = getWords(first.title);
  const secondWords = getWords(second.title);

  return similarity(firstWords, secondWords);
}

function getEntitySimilarity(
  first: RankedNewsArticle,
  second: RankedNewsArticle,
): number {
  const firstEntities = getImportantEntities(first.title);
  const secondEntities = getImportantEntities(second.title);

  return similarity(firstEntities, secondEntities);
}
function hasStrongEntityOverlap(
  first: RankedNewsArticle,
  second: RankedNewsArticle,
): boolean {
  const firstEntities = getImportantEntities(first.title);
  const secondEntities = getImportantEntities(second.title);

  const genericEntities = new Set([
    "google",
    "microsoft",
    "apple",
    "meta",
    "amazon",
    "nvidia",
    "gpu",
    "tpu",
    "ai agent",
    "ai agents",
  ]);

  let sharedSpecificEntities = 0;

  for (const entity of firstEntities) {
    if (secondEntities.has(entity) && !genericEntities.has(entity)) {
      sharedSpecificEntities++;
    }
  }

  return sharedSpecificEntities >= 1;
}

function areSameStory(
  first: RankedNewsArticle,
  second: RankedNewsArticle,
): boolean {
  const titleSimilarity = getTitleSimilarity(first, second);
  const entitySimilarity = getEntitySimilarity(first, second);

  const sameCompany =
    Boolean(first.company) &&
    Boolean(second.company) &&
    first.company === second.company;

  // Rule 1:
  // Very similar titles are almost certainly the same story.
  if (titleSimilarity >= 0.7) {
    return true;
  }

  // Rule 2:
  // Same company + reasonably similar title.
  if (sameCompany && titleSimilarity >= 0.45) {
    return true;
  }

  // Rule 3:
  // Strong entity overlap + reasonably similar title.
  if (entitySimilarity >= 0.75 && titleSimilarity >= 0.4) {
    return true;
  }

  // Rule 4:
  // Event-based stories often use very different wording.
  // If they share the same company and at least two important
  // entities, allow a lower title similarity threshold.
  if (
    sameCompany &&
    hasStrongEntityOverlap(first, second) &&
    titleSimilarity >= 0.3
  ) {
    return true;
  }

  return false;
}

function chooseRepresentative(
  articles: RankedNewsArticle[],
): RankedNewsArticle {
  return [...articles].sort((a, b) => {
    // Highest final score first.
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }

    // If scores are tied, prefer higher source quality.
    if (b.sourceQualityScore !== a.sourceQualityScore) {
      return b.sourceQualityScore - a.sourceQualityScore;
    }

    // Final deterministic fallback.
    return a.title.localeCompare(b.title);
  })[0];
}

export function clusterArticles(articles: RankedNewsArticle[]): StoryCluster[] {
  const clusters: StoryCluster[] = [];

  for (const article of articles) {
    let matchedCluster: StoryCluster | null = null;

    for (const cluster of clusters) {
      if (areSameStory(article, cluster.representative)) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.articles.push(article);

      matchedCluster.representative = chooseRepresentative(
        matchedCluster.articles,
      );
    } else {
      clusters.push({
        id: `story-${clusters.length + 1}`,
        articles: [article],
        representative: article,
      });
    }
  }

  return clusters;
}
