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
  const timestamp = now.toISOString();

  // Check if today's edition already exists.
  const { data: existingEdition, error: existingError } = await supabase
    .from("daily_editions")
    .select("*")
    .eq("edition_date", editionDate)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to check existing edition: ${existingError.message}`,
    );
  }

  if (existingEdition) {
    throw new Error(
      `Edition for ${editionDate} already exists with status "${existingEdition.status}".`,
    );
  }

  // Create edition in PROCESSING state.
  const { data: edition, error: editionError } = await supabase
    .from("daily_editions")
    .insert({
      edition_date: editionDate,
      status: "processing",
      collection_started_at: timestamp,
      processing_started_at: timestamp,
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
    // Clean up edition if article insertion fails.
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
