import { NextResponse } from "next/server";
import { runNewsPipeline } from "@/services/news/pipeline.service";
import { createDailyEdition } from "@/services/news/edition.service";

export async function POST() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const pipeline = await runNewsPipeline();

    if (pipeline.selectedArticles.length !== 10) {
      return NextResponse.json(
        {
          error: "Pipeline did not produce exactly 10 articles.",
          selectedCount: pipeline.selectedArticles.length,
        },
        { status: 422 },
      );
    }

    const result = await createDailyEdition({
      editionDate: today,
      articles: pipeline.selectedArticles,
    });

    return NextResponse.json({
      success: true,
      editionId: result.edition.id,
      editionDate: today,
      articleCount: result.articles.length,
    });
  } catch (error) {
    console.error("[PUBLISH] Failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to publish edition.",
      },
      { status: 500 },
    );
  }
}
