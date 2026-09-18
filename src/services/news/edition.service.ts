import type { SelectedNewsArticle } from "@/services/news/selection.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface CreateDailyEditionInput {
  editionDate: string;
  articles: SelectedNewsArticle[];
}

export async function createDailyEdition({
  editionDate,
  articles,
}: CreateDailyEditionInput) {
  const supabase = createSupabaseServerClient();

  const now = new Date();
  const publishedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: edition, error: editionError } = await supabase
    .from("daily_editions")
    .insert({
      edition_date: editionDate,
      status: "published",
      collection_started_at: publishedAt,
      processing_started_at: publishedAt,
      published_at: publishedAt,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (editionError) {
    throw new Error(`Failed to create daily edition: ${editionError.message}`);
  }

  const articleRows = articles.map((article) => ({
    edition_id: edition.id,
    title: article.title,
    description: article.description,
    summary: null,
    content: article.content,
    original_url: article.originalUrl,
    source_name: article.sourceName,
    source_domain: null,
    author: article.author,
    external_id: article.externalId,
    image_url: article.imageUrl,
    image_alt: null,
    published_at: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : null,
    category: article.category,
    company: article.company,
    topics: article.topics,
    relevance_score: article.relevanceScore,
    importance_score: article.importanceScore,
    source_quality_score: article.sourceQualityScore,
    freshness_score: article.freshnessScore,
    popularity_score: article.popularityScore,
    diversity_score: article.diversityScore,
    final_score: article.finalScore,
    rank: article.rank,
    is_selected: article.isSelected,
  }));

  const { data: savedArticles, error: articlesError } = await supabase
    .from("news_articles")
    .insert(articleRows)
    .select();

  if (articlesError) {
    await supabase.from("daily_editions").delete().eq("id", edition.id);

    throw new Error(
      `Failed to save edition articles: ${articlesError.message}`,
    );
  }

  return {
    edition,
    articles: savedArticles,
  };
}
