import { fetchAllRssSources } from "@/services/news/rss.service";
import { filterRecentArticles } from "@/services/news/filter.service";
import { deduplicateArticles } from "@/services/news/deduplication.service";
import { classifyArticles } from "@/services/news/classification.service";
import { rankArticles } from "@/services/news/ranking.service";
import { clusterArticles } from "@/services/news/clustering.service";
import { selectTopArticles } from "@/services/news/selection.service";
import { filterRelevantArticles } from "@/services/news/content-filter.service";
import { enrichSelectedArticles } from "@/services/news/article-content.service";

export async function runNewsPipeline() {
  // 1. Fetch RSS articles
  const allArticles = await fetchAllRssSources();

  // 2. Keep only recent articles
  const recentArticles = filterRecentArticles(allArticles);

  // 3. Remove duplicate articles
  const uniqueArticles = deduplicateArticles(recentArticles);

  // 4. Keep relevant tech/IT articles
  const relevantArticles = filterRelevantArticles(uniqueArticles);

  // 5. Classify articles
  const classifiedArticles = classifyArticles(relevantArticles);

  // 6. Calculate scores
  const rankedArticles = rankArticles(classifiedArticles);

  // 7. Group similar stories
  const storyClusters = clusterArticles(rankedArticles);

  // 8. Take one representative from each cluster
  const representatives = storyClusters.map(
    (cluster) => cluster.representative,
  );

  // 9. Select the final 10 articles
  const selectedArticles = selectTopArticles(representatives);

  // 10. Fetch full content + image from original pages
  //     ONLY for the selected 10 articles
  const enrichedArticles = await enrichSelectedArticles(selectedArticles);

  return {
    allArticles,
    recentArticles,
    uniqueArticles,
    relevantArticles,
    classifiedArticles,
    rankedArticles,
    storyClusters,

    // These are now the final 10 WITH full content
    selectedArticles: enrichedArticles,
  };
}
