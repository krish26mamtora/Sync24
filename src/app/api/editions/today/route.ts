import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const today = new Date().toISOString().slice(0, 10);

    const { data: edition, error: editionError } = await supabase
      .from("daily_editions")
      .select("*")
      .eq("edition_date", today)
      .eq("status", "published")
      .single();

    if (editionError) {
      return NextResponse.json(
        {
          error: "Today's edition is not available.",
        },
        { status: 404 },
      );
    }

    const { data: articles, error: articlesError } = await supabase
      .from("news_articles")
      .select("*")
      .eq("edition_id", edition.id)
      .eq("is_selected", true)
      .order("rank", { ascending: true });

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    return NextResponse.json({
      edition,
      articles,
    });
  } catch (error) {
    console.error("[TODAY] Failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch today's edition.",
      },
      { status: 500 },
    );
  }
}
