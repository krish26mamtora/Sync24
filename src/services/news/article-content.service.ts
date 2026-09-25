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

    // -------------------------------------------------------
    // Remove obvious page-level junk BEFORE selecting body
    // -------------------------------------------------------

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
      ].join(","),
    ).remove();

    // -------------------------------------------------------
    // Try to locate the actual article
    // -------------------------------------------------------

    const selectors = [
      '[itemprop="articleBody"]',
      "article",
      ".article-content",
      ".article-body",
      ".entry-content",
      ".post-content",
      "main",
    ];

    let articleElement = null;

    for (const selector of selectors) {
      const element = $(selector).first();

      if (!element.length) {
        continue;
      }

      const textLength = element.text().replace(/\s+/g, " ").trim().length;

      /*
       * Require a meaningful amount of text.
       *
       * This prevents tiny UI containers from becoming
       * the article.
       */
      if (textLength >= 500) {
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

    // -------------------------------------------------------
    // Clean the selected article AGAIN
    // -------------------------------------------------------

    const rawArticleHtml = articleElement.html()?.trim() || null;

    if (!rawArticleHtml) {
      return {
        content: null,
        imageUrl: null,
      };
    }

    /*
     * THIS is the critical step.
     *
     * We never store articleElement.html() directly.
     */
    const cleanedContent = cleanArticleHtml(rawArticleHtml);

    // -------------------------------------------------------
    // Image
    // -------------------------------------------------------

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
