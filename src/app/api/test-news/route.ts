import { NextResponse } from "next/server";
// import { runNewsPipeline } from "@/services/news/news.service";
import { runNewsPipeline } from "@/services/news/pipeline.service";
export async function GET() {
  try {
    const result = await runNewsPipeline();

    return NextResponse.json({
      totalFetched: result.allArticles.length,
      recentCount: result.recentArticles.length,
      uniqueCount: result.uniqueArticles.length,
      relevantCount: result.relevantArticles.length,
      rankedCount: result.rankedArticles.length,
      clusterCount: result.storyClusters.length,
      selectedCount: result.selectedArticles.length,

      selectedArticles: result.selectedArticles.map((article) => ({
        rank: article.rank,
        title: article.title,
        source: article.sourceName,

        contentLength: article.content?.length ?? 0,
        hasContent: Boolean(article.content),
        hasImage: Boolean(article.imageUrl),
      })),
    });
  } catch (error) {
    console.error("[TEST NEWS]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run news pipeline",
      },
      { status: 500 },
    );
  }
}
