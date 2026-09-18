import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const today = new Date().toISOString().slice(0, 10);

    const { data: edition, error: editionError } = await supabase
      .from("daily_editions")
      .select("id, edition_date, status")
      .eq("edition_date", today)
      .single();

    if (editionError) {
      return NextResponse.json(
        {
          error: editionError.message,
        },
        { status: 404 },
      );
    }

    const { data: articles, error: articlesError } = await supabase
      .from("news_articles")
      .select("id, rank, title, description, content, image_url, original_url")
      .eq("edition_id", edition.id)
      .eq("is_selected", true)
      .order("rank", { ascending: true });

    if (articlesError) {
      throw new Error(articlesError.message);
    }

    return NextResponse.json({
      edition,
      articles: articles?.map((article) => ({
        rank: article.rank,
        title: article.title,

        description: article.description,

        contentLength: article.content?.length ?? 0,
        hasContent: Boolean(article.content),

        // Show the actual beginning of content
        contentPreview: article.content?.slice(0, 1000) ?? null,

        imageUrl: article.image_url,
        originalUrl: article.original_url,
      })),
    });
  } catch (error) {
    console.error("[DEBUG TODAY]", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Debug request failed",
      },
      { status: 500 },
    );
  }
}
