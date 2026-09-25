import * as cheerio from "cheerio";

import type { SelectedNewsArticle } from "@/services/news/selection.service";

import { cleanArticleHtml } from "@/lib/utils/clean-html";

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
          "Mozilla/5.0 (compatible; Sync24/1.0; +https://sync24.vercel.app)",

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

    // =======================================================
    // STEP 1
    // Remove page-level junk BEFORE article detection
    // =======================================================

    $(
      [
        "script",
        "style",
        "noscript",
        "template",
        "iframe",
        "object",
        "embed",

        "nav",
        "header",
        "footer",
        "aside",

        "form",
        "input",
        "button",
        "select",
        "option",
        "textarea",

        "video",
        "audio",
        "canvas",

        ".ad",
        ".ads",
        ".advertisement",
        ".ad-unit",

        ".share",
        ".share-buttons",
        ".social",
        ".social-share",

        ".newsletter",
        ".newsletter-signup",

        ".comments",
        ".comment-section",

        ".related",
        ".related-posts",
        ".related-articles",

        ".recommended",
        ".recommendations",

        ".sidebar",
        ".widget",

        ".dropdown",
        ".popup",
        ".modal",

        ".author",
        ".authors",
        ".author-info",
        ".author-bio",
        ".byline",
        ".article-author",
        ".article-byline",
      ].join(","),
    ).remove();

    // =======================================================
    // STEP 2
    // Find the actual article
    // =======================================================

    const selectors = [
      '[itemprop="articleBody"]',
      "article",
      ".article-content",
      ".article-body",
      ".entry-content",
      ".post-content",
    ];

    let articleElement: ReturnType<typeof $> | null = null;

    for (const selector of selectors) {
      const element = $(selector).first();

      if (!element.length) {
        continue;
      }

      const textLength = element.text().replace(/\s+/g, " ").trim().length;

      /*
       * Require a reasonable amount of actual text.
       *
       * This prevents tiny UI elements from becoming
       * the article body.
       */
      if (textLength >= 500) {
        articleElement = element;
        break;
      }
    }

    // =======================================================
    // STEP 3
    // Nothing found
    // =======================================================

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

    // =======================================================
    // STEP 4
    // NEVER store articleElement.html() directly
    // =======================================================

    const rawArticleHtml = articleElement.html()?.trim() || null;

    if (!rawArticleHtml) {
      return {
        content: null,
        imageUrl: null,
      };
    }

    // =======================================================
    // STEP 5
    // Strictly clean article HTML
    // =======================================================

    const cleanedContent = cleanArticleHtml(rawArticleHtml);

    // =======================================================
    // STEP 6
    // Main image
    // =======================================================

    const imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      articleElement.find("img").first().attr("src") ||
      null;

    return {
      content: cleanedContent,
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
