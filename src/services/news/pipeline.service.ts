import { fetchAllRssSources } from "@/services/news/rss.service";
import { filterRecentArticles } from "@/services/news/filter.service";
import { deduplicateArticles } from "@/services/news/deduplication.service";
import { classifyArticles } from "@/services/news/classification.service";
import { rankArticles } from "@/services/news/ranking.service";
import { clusterArticles } from "@/services/news/clustering.service";
import { selectTopArticles } from "@/services/news/selection.service";
import { enrichSelectedArticles } from "@/services/news/article-content.service";

export async function runNewsPipeline() {
  const allArticles = await fetchAllRssSources();

  const recentArticles = filterRecentArticles(allArticles);

  const uniqueArticles = deduplicateArticles(recentArticles);

  const classifiedArticles = classifyArticles(uniqueArticles);

  const rankedArticles = rankArticles(classifiedArticles);

  const storyClusters = clusterArticles(rankedArticles);

  const representatives = storyClusters.map(
    (cluster) => cluster.representative,
  );

  // First select the final 10 articles.
  const selectedArticles = selectTopArticles(representatives);

  // Fetch detailed content ONLY for the selected 10.
  const enrichedArticles = await enrichSelectedArticles(selectedArticles);

  return {
    allArticles,
    recentArticles,
    uniqueArticles,
    classifiedArticles,
    rankedArticles,
    storyClusters,
    selectedArticles: enrichedArticles,
  };
}
