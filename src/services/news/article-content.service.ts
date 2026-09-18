import * as cheerio from "cheerio";
import type { SelectedNewsArticle } from "@/services/news/selection.service";

export interface ExtractedArticleContent {
  content: string | null;
  imageUrl: string | null;
}
export async function enrichSelectedArticles(
  articles: SelectedNewsArticle[],
): Promise<SelectedNewsArticle[]> {
  const results = await Promise.all(
    articles.map(async (article) => {
      const extracted = await extractArticleContent(article.originalUrl);

      return {
        ...article,

        content: extracted.content || article.content,

        imageUrl: extracted.imageUrl || article.imageUrl,
      };
    }),
  );

  return results;
}
export async function extractArticleContent(
  url: string,
): Promise<ExtractedArticleContent> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DailyHunt/1.0; +https://dailyhunt.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[ARTICLE CONTENT] Failed ${response.status}: ${url}`);

      return {
        content: null,
        imageUrl: null,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove elements that should never be part of article content.
    $(
      "script, style, noscript, iframe, nav, footer, header, " +
        ".ad-unit, " +
        ".jw-player-inline-promo",
    ).remove();

    const selectors = [
      "article",
      '[itemprop="articleBody"]',
      ".article-content",
      ".article-body",
      ".entry-content",
      ".post-content",
      "main",
    ];

    let articleElement = null;

    for (const selector of selectors) {
      const element = $(selector).first();

      if (element.length > 0 && (element.text().trim().length ?? 0) > 500) {
        articleElement = element;
        break;
      }
    }

    if (!articleElement) {
      console.warn(`[ARTICLE CONTENT] No article body found: ${url}`);

      return {
        content: null,
        imageUrl:
          $('meta[property="og:image"]').attr("content") ||
          $('meta[name="twitter:image"]').attr("content") ||
          null,
      };
    }

    // Remove unnecessary elements inside the article.
    articleElement
      .find(
        "script, style, noscript, iframe, " +
          ".ad-unit, " +
          ".jw-player-inline-promo",
      )
      .remove();

    const content = articleElement.html()?.trim() || null;

    const imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;

    return {
      content,
      imageUrl,
    };
  } catch (error) {
    console.error(`[ARTICLE CONTENT] Error: ${url}`, error);

    return {
      content: null,
      imageUrl: null,
    };
  }
}
