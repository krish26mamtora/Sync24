export type NewsSourceType = "rss" | "atom" | "hacker-news";

export interface NewsSource {
  id: string;
  name: string;
  type: NewsSourceType;
  url: string;
  enabled: boolean;
  sourceQuality: number;
}

export const newsSources: NewsSource[] = [
  {
    id: "techcrunch",
    name: "TechCrunch",
    type: "rss",
    url: "https://techcrunch.com/feed/",
    enabled: true,
    sourceQuality: 15,
  },

  {
    id: "ars-technica",
    name: "Ars Technica",
    type: "rss",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    enabled: true,
    sourceQuality: 15,
  },

  {
    id: "wired",
    name: "WIRED",
    type: "rss",
    url: "https://www.wired.com/feed/rss",
    enabled: true,
    sourceQuality: 15,
  },
  {
    id: "aws",
    name: "AWS News Blog",
    type: "rss",
    url: "https://aws.amazon.com/blogs/aws/feed/",
    enabled: true,
    sourceQuality: 14,
  },
  {
    id: "the-verge",
    name: "The Verge",
    type: "rss",
    url: "https://www.theverge.com/rss/index.xml",
    enabled: true,
    sourceQuality: 15,
  },

  {
    id: "github",
    name: "GitHub Blog",
    type: "atom",
    url: "https://github.blog/feed/",
    enabled: true,
    sourceQuality: 15,
  },

  {
    id: "chrome-developers",
    name: "Chrome Developers",
    type: "atom",
    url: "https://developer.chrome.com/static/blog/feed.xml",
    enabled: true,
    sourceQuality: 14,
  },

  {
    id: "openai",
    name: "OpenAI",
    type: "rss",
    url: "https://openai.com/news/rss.xml",
    enabled: true,
    sourceQuality: 15,
  },

  {
    id: "hacker-news",
    name: "Hacker News",
    type: "hacker-news",
    url: "https://hacker-news.firebaseio.com/v0/topstories.json",
    enabled: true,
    sourceQuality: 10,
  },
];
