import { NextResponse } from "next/server";
import { runNewsPipeline } from "@/services/news/pipeline.service";
import { createDailyEdition } from "@/services/news/edition.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIndiaDate } from "@/lib/utils/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Protect the endpoint.
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON PREPARE] CRON_SECRET is not configured.");

      return NextResponse.json(
        { error: "Cron secret is not configured." },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const editionDate = getIndiaDate();

    console.log(`[CRON PREPARE] Starting preparation for ${editionDate}`);

    const supabase = createSupabaseServerClient();

    // Idempotency check.
    const { data: existingEdition, error: existingError } = await supabase
      .from("daily_editions")
      .select("id, edition_date, status")
      .eq("edition_date", editionDate)
      .maybeSingle();

    if (existingError) {
      throw new Error(
        `Failed to check today's edition: ${existingError.message}`,
      );
    }

    if (existingEdition) {
      console.log(
        `[CRON PREPARE] Edition already exists: ${existingEdition.id} (${existingEdition.status})`,
      );

      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Today's edition already exists.",
        editionId: existingEdition.id,
        editionDate,
        status: existingEdition.status,
      });
    }

    // Run the complete pipeline.
    const pipeline = await runNewsPipeline();

    if (pipeline.selectedArticles.length !== 10) {
      console.error(
        `[CRON PREPARE] Expected 10 articles but got ${pipeline.selectedArticles.length}`,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Pipeline did not produce exactly 10 articles.",
          selectedCount: pipeline.selectedArticles.length,
          editionDate,
        },
        { status: 422 },
      );
    }

    // Save today's edition in "processing" state.
    const result = await createDailyEdition({
      editionDate,
      articles: pipeline.selectedArticles,
    });

    console.log(
      `[CRON PREPARE] Successfully prepared edition ${result.edition.id}`,
    );

    return NextResponse.json({
      success: true,
      skipped: false,
      editionId: result.edition.id,
      editionDate,
      articleCount: result.articles.length,
      status: result.edition.status,
    });
  } catch (error) {
    console.error("[CRON PREPARE] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to prepare today's edition.",
      },
      { status: 500 },
    );
  }
}
