import { fetchAllRssSources } from "@/services/news/rss.service";
import { filterRecentArticles } from "@/services/news/filter.service";
import { filterRelevantArticles } from "@/services/news/content-filter.service";
import { deduplicateArticles } from "@/services/news/deduplication.service";
import { classifyArticles } from "@/services/news/classification.service";
import { rankArticles } from "@/services/news/ranking.service";
import { clusterArticles } from "@/services/news/clustering.service";
import { selectTopArticles } from "@/services/news/selection.service";
import { enrichSelectedArticles } from "@/services/news/article-content.service";

export async function runNewsPipeline() {
  console.log("[PIPELINE] Starting news pipeline...");

  const allArticles = await fetchAllRssSources();
  console.log(`[PIPELINE] Fetched: ${allArticles.length}`);

  const recentArticles = filterRecentArticles(allArticles);
  console.log(`[PIPELINE] Recent: ${recentArticles.length}`);

  const uniqueArticles = deduplicateArticles(recentArticles);
  console.log(`[PIPELINE] Unique: ${uniqueArticles.length}`);

  const relevantArticles = filterRelevantArticles(uniqueArticles);
  console.log(`[PIPELINE] Relevant: ${relevantArticles.length}`);

  const classifiedArticles = classifyArticles(relevantArticles);

  const rankedArticles = rankArticles(classifiedArticles);
  console.log(`[PIPELINE] Ranked: ${rankedArticles.length}`);

  const storyClusters = clusterArticles(rankedArticles);
  console.log(`[PIPELINE] Clusters: ${storyClusters.length}`);

  const representatives = storyClusters.map(
    (cluster) => cluster.representative,
  );

  const selectedArticles = selectTopArticles(representatives);
  console.log(`[PIPELINE] Selected: ${selectedArticles.length}`);

  const enrichedArticles = await enrichSelectedArticles(selectedArticles);

  console.log(`[PIPELINE] Enriched: ${enrichedArticles.length}`);

  return {
    allArticles,
    recentArticles,
    uniqueArticles,
    relevantArticles,
    classifiedArticles,
    rankedArticles,
    storyClusters,
    selectedArticles: enrichedArticles,
  };
}
