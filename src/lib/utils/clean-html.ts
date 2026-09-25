// src/lib/utils/clean-html.ts

import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";

/**
 * Elements that should NEVER be stored as article content.
 */
const JUNK_SELECTORS = [
  // Scripts / embedded code
  "script",
  "style",
  "noscript",
  "template",
  "iframe",
  "object",
  "embed",

  // Page structure
  "nav",
  "header",
  "footer",
  "aside",

  // Forms / controls
  "form",
  "input",
  "button",
  "select",
  "option",
  "textarea",

  // Media players
  "video",
  "audio",
  "source",
  "canvas",

  // Ads
  ".ad",
  ".ads",
  ".advert",
  ".advertisement",
  ".ad-container",
  ".ad-wrapper",
  ".ad-unit",
  ".advertising",
  "[class*='advert']",
  "[class*='ad-container']",
  "[id*='advert']",
  "[id*='ad-container']",

  // Social / sharing
  ".share",
  ".sharing",
  ".share-buttons",
  ".social",
  ".social-share",
  ".social-buttons",
  ".social-links",
  "[class*='share']",
  "[class*='social']",

  // Comments
  "#comments",
  ".comments",
  ".comment",
  ".comment-section",
  ".comment-list",
  "[class*='comment']",

  // Newsletter / subscriptions
  ".newsletter",
  ".newsletter-signup",
  ".subscribe",
  ".subscription",
  ".signup",
  "[class*='newsletter']",
  "[class*='subscribe']",

  // Related content
  ".related",
  ".related-posts",
  ".related-articles",
  ".recommended",
  ".recommendations",
  ".more-stories",
  ".read-more",
  "[class*='related']",
  "[class*='recommended']",

  // UI widgets
  ".dropdown",
  ".menu",
  ".popup",
  ".modal",
  ".tooltip",
  ".toolbar",
  ".widget",
  ".sidebar",
  "[class*='dropdown']",
  "[class*='widget']",
  "[class*='sidebar']",
];

/**
 * Only these tags are allowed in stored article HTML.
 *
 * Notice that div/span are NOT allowed.
 */
const ALLOWED_ARTICLE_TAGS = [
  "p",
  "br",

  "h2",
  "h3",
  "h4",

  "strong",
  "b",
  "em",
  "i",

  "ul",
  "ol",
  "li",

  "blockquote",

  "pre",
  "code",

  "figure",
  "figcaption",

  "img",

  "a",
];

/**
 * Clean article HTML.
 *
 * Result contains only:
 * - article text
 * - headings
 * - lists
 * - blockquotes
 * - code
 * - images
 *
 * No buttons/forms/dropdowns/social widgets/etc.
 */
export function cleanArticleHtml(rawHtml: string | null): string | null {
  if (!rawHtml) {
    return null;
  }

  const $ = cheerio.load(rawHtml);

  // ---------------------------------------------------------
  // 1. Remove known junk
  // ---------------------------------------------------------

  for (const selector of JUNK_SELECTORS) {
    try {
      $(selector).remove();
    } catch {
      // Ignore invalid selectors.
    }
  }

  // ---------------------------------------------------------
  // 2. Remove HTML comments
  // ---------------------------------------------------------

  $("*")
    .contents()
    .filter((_, node) => node.type === "comment")
    .remove();

  // ---------------------------------------------------------
  // 3. Remove obvious UI text containers
  // ---------------------------------------------------------

  const UI_TEXT_PATTERNS = [
    /^share$/i,
    /^share this/i,
    /^follow us/i,
    /^subscribe$/i,
    /^sign up$/i,
    /^log in$/i,
    /^login$/i,
    /^read more$/i,
    /^related articles?$/i,
    /^recommended/i,
    /^advertisement$/i,
    /^comments?$/i,
    /^load more$/i,
    /^show more$/i,
    /^next$/i,
    /^previous$/i,
  ];

  $("div, section, span, p").each((_, element) => {
    const text = $(element).text().trim();

    if (
      text &&
      text.length < 100 &&
      UI_TEXT_PATTERNS.some((pattern) => pattern.test(text))
    ) {
      $(element).remove();
    }
  });

  // ---------------------------------------------------------
  // 4. Remove empty elements
  // ---------------------------------------------------------

  $("p, h2, h3, h4, li, blockquote, figure, figcaption").each((_, element) => {
    const $element = $(element);

    const hasText = $element.text().trim().length > 0;

    const hasImage = $element.find("img").length > 0;

    if (!hasText && !hasImage) {
      $element.remove();
    }
  });

  // ---------------------------------------------------------
  // 5. Clean images
  // ---------------------------------------------------------

  $("img").each((_, element) => {
    const $img = $(element);

    const src =
      $img.attr("src") ||
      $img.attr("data-src") ||
      $img.attr("data-lazy-src") ||
      $img.attr("data-original");

    if (!src) {
      $img.remove();
      return;
    }

    const alt = $img.attr("alt");

    // Remove every attribute.
    for (const attribute of Object.keys(element.attribs ?? {})) {
      $img.removeAttr(attribute);
    }

    // Restore only approved attributes.
    $img.attr("src", src);

    if (alt?.trim()) {
      $img.attr("alt", alt.trim());
    }
  });

  // ---------------------------------------------------------
  // 6. Remove links but preserve their text
  // ---------------------------------------------------------

  $("a").each((_, element) => {
    const $a = $(element);

    $a.replaceWith($a.contents());
  });

  // ---------------------------------------------------------
  // 7. Remove classes, IDs and inline attributes
  // ---------------------------------------------------------

  $("*").each((_, element) => {
    const $element = $(element);

    // Images were already cleaned above.
    if (element.type === "tag" && element.name === "img") {
      return;
    }

    for (const attribute of Object.keys((element as any).attribs ?? {})) {
      $element.removeAttr(attribute);
    }
  });

  // ---------------------------------------------------------
  // 8. Get cleaned HTML
  // ---------------------------------------------------------

  const bodyHtml = $("body").html()?.trim() || "";

  if (!bodyHtml) {
    return null;
  }

  // ---------------------------------------------------------
  // 9. Final whitelist sanitizer
  // ---------------------------------------------------------

  const cleaned = sanitizeHtml(bodyHtml, {
    allowedTags: ALLOWED_ARTICLE_TAGS,

    allowedAttributes: {
      img: ["src", "alt"],
    },

    allowedSchemes: ["http", "https"],

    allowedSchemesByTag: {
      img: ["http", "https"],
    },

    disallowedTagsMode: "discard",

    exclusiveFilter: (frame) => {
      return (
        !frame.text.trim() &&
        frame.tag !== "img" &&
        frame.tag !== "br" &&
        frame.mediaChildren.length === 0
      );
    },
  });

  return cleaned.trim() || null;
}

/**
 * Convert HTML to plain text.
 *
 * Used for description/content snippets.
 */
export function cleanArticleText(rawText: string | null): string | null {
  if (!rawText) {
    return null;
  }

  const text = sanitizeHtml(rawText, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

  return text || null;
}

/**
 * Clean article title.
 *
 * Title must always be plain text.
 */
export function cleanArticleTitle(rawTitle: string | null): string | null {
  if (!rawTitle) {
    return null;
  }

  const text = sanitizeHtml(rawTitle, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

  return text || null;
}
