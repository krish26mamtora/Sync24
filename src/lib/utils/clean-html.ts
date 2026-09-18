// lib/utils/clean-html.ts
import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";

// Selectors commonly used for UI chrome injected into RSS content
const JUNK_SELECTORS = [
  ".share-buttons",
  ".social-share",
  ".bookmark",
  ".like-button",
  ".dropdown",
  ".related-posts",
  ".newsletter-signup",
  ".advertisement",
  ".ad",
  "[class*='share']",
  "[class*='social']",
  "[class*='bookmark']",
  "[class*='dropdown']",
  "[class*='widget']",
  "[id*='comment']",
  "iframe",
  "form",
  "button",
  "nav",
  "footer",
  "script",
  "style",
];

export function cleanArticleHtml(rawHtml: string | null): string | null {
  if (!rawHtml) return null;

  const $ = cheerio.load(rawHtml);

  // Remove known junk elements
  JUNK_SELECTORS.forEach((selector) => {
    $(selector).remove();
  });

  // Remove empty elements left behind
  $("div, span, p").each((_, el) => {
    const $el = $(el);
    if (!$el.text().trim() && $el.find("img").length === 0) {
      $el.remove();
    }
  });

  const cleanedHtml = $.html();

  // Whitelist-sanitize what remains
  return sanitizeHtml(cleanedHtml, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "figure",
      "figcaption",
      "pre",
      "code",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
    },
    // Strip any inline styles/classes/ids entirely
    allowedClasses: {},
    exclusiveFilter: (frame) => {
      // Drop nodes with no text and no image (extra safety net)
      return (
        !frame.text.trim() &&
        !["img", "br"].includes(frame.tag) &&
        frame.mediaChildren.length === 0
      );
    },
  });
}

export function cleanArticleText(rawText: string | null): string | null {
  if (!rawText) return null;
  // For description/contentSnippet fields — strip all tags, just get plain text
  return sanitizeHtml(rawText, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
