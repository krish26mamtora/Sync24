import { NextResponse } from "next/server";
// import { runNewsPipeline } from "@/services/news/news.service";
import { runNewsPipeline } from "@/services/news/pipeline.service";
import { createDailyEdition } from "@/services/news/edition.service";

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const result = await runNewsPipeline();

    const edition = await createDailyEdition({
      editionDate: today,
      articles: result.selectedArticles,
    });

    return NextResponse.json({
      success: true,
      editionId: edition.edition.id,
      editionDate: today,
      articleCount: edition.articles.length,
    });
  } catch (error) {
    console.error("[TEST PUBLISH]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to publish edition",
      },
      { status: 500 },
    );
  }
}
