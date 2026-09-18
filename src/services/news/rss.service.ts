import Parser from "rss-parser";

import { newsSources } from "@/config/news-sources";
import type { NormalizedNewsArticle } from "@/types/news";
import { cleanArticleHtml, cleanArticleText } from "@/lib/utils/clean-html";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["media:group", "mediaGroup"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

function extractImage(item: any): string | null {
  // 1. Standard enclosure
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  // 2. media:content
  if (item.mediaContent?.$?.url) {
    return item.mediaContent.$.url;
  }

  if (item.mediaContent?.url) {
    return item.mediaContent.url;
  }

  // 3. media:thumbnail
  if (item.mediaThumbnail?.$?.url) {
    return item.mediaThumbnail.$.url;
  }

  if (item.mediaThumbnail?.url) {
    return item.mediaThumbnail.url;
  }

  // 4. Try extracting an image from HTML
  const html = item.contentEncoded || item.content || item.description;

  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function normalizeItem(
  item: any,
  source: (typeof newsSources)[number],
): NormalizedNewsArticle | null {
  if (!item.title || !item.link) {
    return null;
  }

  console.log("[RSS DEBUG]", {
    source: source.name,
    title: item.title,
    description: item.description,
    content: item.content,
    contentEncoded: item.contentEncoded,
    contentSnippet: item.contentSnippet,
  });
  return {
    title: item.title.trim(),

    description: cleanArticleText(
      item.description?.trim() || item.contentSnippet?.trim() || null,
    ),

    content: cleanArticleHtml(
      item.contentEncoded?.trim() || item.content?.trim() || null,
    ),

    originalUrl: item.link,
    sourceId: source.id,
    sourceName: source.name,
    author: item.creator?.trim() || item.author?.trim() || null,
    imageUrl: extractImage(item),
    publishedAt: item.isoDate || item.pubDate || null,
    externalId: item.guid || item.id || null,
  };
}
//   return {
//     title: item.title.trim(),

//     description:
//       item.description?.trim() || item.contentSnippet?.trim() || null,

//     content: item.contentEncoded?.trim() || item.content?.trim() || null,

//     originalUrl: item.link,

//     sourceId: source.id,
//     sourceName: source.name,

//     author: item.creator?.trim() || item.author?.trim() || null,

//     imageUrl: extractImage(item),

//     publishedAt: item.isoDate || item.pubDate || null,

//     externalId: item.guid || item.id || null,
//   };
// }

export async function fetchRssSource(
  source: (typeof newsSources)[number],
): Promise<NormalizedNewsArticle[]> {
  if (source.type === "hacker-news") {
    throw new Error("Hacker News is not handled by the RSS service.");
  }

  const feed = await parser.parseURL(source.url);

  return feed.items
    .map((item) => normalizeItem(item, source))
    .filter((article): article is NormalizedNewsArticle => article !== null);
}

export async function fetchAllRssSources(): Promise<NormalizedNewsArticle[]> {
  const rssSources = newsSources.filter(
    (source) =>
      source.enabled && (source.type === "rss" || source.type === "atom"),
  );

  const results = await Promise.allSettled(
    rssSources.map((source) => fetchRssSource(source)),
  );

  const articles: NormalizedNewsArticle[] = [];

  results.forEach((result, index) => {
    const source = rssSources[index];

    if (result.status === "fulfilled") {
      articles.push(...result.value);

      console.log(`[RSS] ${source.name}: ${result.value.length} articles`);
    } else {
      console.error(`[RSS] ${source.name}: failed`, result.reason);
    }
  });

  return articles;
}
