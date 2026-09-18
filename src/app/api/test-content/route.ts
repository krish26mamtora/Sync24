import { NextResponse } from "next/server";
import { extractArticleContent } from "@/services/news/article-content.service";

export async function GET() {
  const url =
    "https://techcrunch.com/2026/09/17/google-nvidia-and-anthropic-want-emerald-ai-to-find-space-on-the-grid-for-more-data-centers/";

  try {
    const result = await extractArticleContent(url);

    return NextResponse.json({
      url,
      contentFound: Boolean(result.content),
      contentLength: result.content?.length ?? 0,
      imageUrl: result.imageUrl,
      content: result.content,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract article content.",
      },
      { status: 500 },
    );
  }
}
