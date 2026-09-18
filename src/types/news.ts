export interface NormalizedNewsArticle {
  title: string;

  description: string | null;

  content: string | null;

  originalUrl: string;

  sourceId: string;

  sourceName: string;

  author: string | null;

  imageUrl: string | null;

  publishedAt: string | null;

  externalId: string | null;
}

export interface ClassifiedNewsArticle extends NormalizedNewsArticle {
  category: string;

  company: string | null;

  topics: string[];
}
