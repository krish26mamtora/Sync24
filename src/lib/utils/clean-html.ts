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

  // Newsletter / subscription
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
  ".popup",
  ".modal",
  ".tooltip",
  ".toolbar",
  ".widget",
  ".sidebar",

  "[class*='dropdown']",
  "[class*='widget']",
  "[class*='sidebar']",

  // Author information
  ".author",
  ".authors",
  ".author-info",
  ".author-bio",
  ".byline",
  ".article-author",
  ".article-byline",
];

/**
 * These are the ONLY HTML tags that are allowed
 * inside the stored article content.
 *
 * div/span are intentionally NOT included.
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
];

/**
 * Clean article HTML.
 *
 * Output contains only:
 *
 * - paragraphs
 * - headings
 * - lists
 * - quotes
 * - code
 * - figures
 * - images
 */
export function cleanArticleHtml(rawHtml: string | null): string | null {
  if (!rawHtml) {
    return null;
  }

  const $ = cheerio.load(rawHtml);

  // =========================================================
  // STEP 1
  // Remove known junk elements
  // =========================================================

  for (const selector of JUNK_SELECTORS) {
    try {
      $(selector).remove();
    } catch {
      // Ignore invalid selectors.
    }
  }

  // =========================================================
  // STEP 2
  // Remove HTML comments
  // =========================================================

  $("*")
    .contents()
    .filter((_, node) => node.type === "comment")
    .remove();

  // =========================================================
  // STEP 3
  // Remove obvious UI text
  // =========================================================

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

  // =========================================================
  // STEP 4
  // Clean figures
  //
  // Some publishers put caption text directly inside
  // <figure> instead of using <figcaption>.
  // =========================================================

  $("figure").each((_, element) => {
    const $figure = $(element);

    const $image = $figure.find("img").first();

    // Clone figure and remove image so that we can
    // extract only the caption text.
    const $clone = $figure.clone();

    $clone.find("img").remove();

    const captionText = $clone.text().replace(/\s+/g, " ").trim();

    // Remove everything from original figure.
    $figure.empty();

    // Put image back.
    if ($image.length) {
      $figure.append($image);
    }

    // Convert raw figure text into figcaption.
    if (captionText) {
      $figure.append($("<figcaption>").text(captionText));
    }

    // Remove useless empty figure.
    if (!$image.length && !captionText) {
      $figure.remove();
    }
  });

  // =========================================================
  // STEP 5
  // Clean images
  // =========================================================

  $("img").each((_, element) => {
    const $img = $(element);

    /*
     * Different websites use different attributes
     * for lazy-loaded images.
     */
    const src =
      $img.attr("src") ||
      $img.attr("data-src") ||
      $img.attr("data-lazy-src") ||
      $img.attr("data-original");

    // No usable image URL = remove image.
    if (!src) {
      $img.remove();
      return;
    }

    const alt = $img.attr("alt");

    /*
     * Cheerio's Element type is not exported by your
     * installed version, so don't use cheerio.Element.
     *
     * We only need the attribute names here.
     */
    for (const attribute of Object.keys((element as any).attribs ?? {})) {
      $img.removeAttr(attribute);
    }

    // Keep ONLY src.
    $img.attr("src", src);

    // Keep alt if available.
    if (alt?.trim()) {
      $img.attr("alt", alt.trim());
    }
  });

  // =========================================================
  // STEP 6
  // Remove links but preserve their text
  // =========================================================

  $("a").each((_, element) => {
    const $a = $(element);

    /*
     * Example:
     *
     * <a href="...">OpenAI</a>
     *
     * becomes:
     *
     * OpenAI
     */
    $a.replaceWith($a.contents());
  });

  // =========================================================
  // STEP 7
  // Normalize whitespace
  // =========================================================

  $("p, h2, h3, h4, li, blockquote, figcaption").each((_, element) => {
    const $element = $(element);

    const text = $element.text().replace(/\s+/g, " ").trim();

    if (text) {
      $element.text(text);
    }
  });

  // =========================================================
  // STEP 8
  // Remove empty elements
  // =========================================================

  $("p, h2, h3, h4, li, blockquote, figure, figcaption").each((_, element) => {
    const $element = $(element);

    const hasText = $element.text().trim().length > 0;

    const hasImage = $element.find("img").length > 0;

    if (!hasText && !hasImage) {
      $element.remove();
    }
  });

  // =========================================================
  // STEP 9
  // Remove attributes from everything except images
  // =========================================================

  $("*").each((_, element) => {
    const $element = $(element);

    if (element.type === "tag" && element.name === "img") {
      return;
    }

    for (const attribute of Object.keys((element as any).attribs ?? {})) {
      $element.removeAttr(attribute);
    }
  });

  // =========================================================
  // STEP 10
  // Get cleaned HTML
  // =========================================================

  const bodyHtml = $("body").html()?.trim() || "";

  if (!bodyHtml) {
    return null;
  }

  // =========================================================
  // STEP 11
  // FINAL whitelist sanitizer
  // =========================================================

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
 * Used for RSS descriptions/snippets.
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
 * Article title must always be plain text.
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
