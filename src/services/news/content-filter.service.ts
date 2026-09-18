import type { NormalizedNewsArticle } from "@/types/news";

const EXCLUDED_KEYWORDS = [
  // Politics
  "trump",
  "biden",
  "election",
  "senate",
  "congress",
  "political campaign",
  "democrat",
  "republican",

  // Sports
  "football",
  "basketball",
  "baseball",
  "soccer",
  "cricket",
  "nfl",
  "nba",
  "mlb",

  // Entertainment
  "celebrity",
  "hollywood",
  "reality tv",
  "actor",
  "actress",
  "movie review",
  "tv show",

  // Food
  "restaurant",
  "recipe",
  "cooking",
  "meal delivery",
  "food delivery",

  // Travel
  "travel",
  "hotel",
  "vacation",
  "tourism",
  "flight deals",

  // Health
  "medical",
  "medicine",
  "disease",
  "cancer treatment",
  "healthcare",
  "wellness",

  // Automotive
  "car review",
  "car reviews",
  "suv",
  "vehicle review",
  "electric vehicle",
  "ev charger",

  // Shopping / promotions
  "promo code",
  "promo codes",
  "coupon",
  "coupons",
  "discount code",
  "discount codes",
  "sale",
  "deals",
  "best products",

  // General Consumer Tech & Gadgets (Non-AI/Software)
  "smartwatch",
  "fitness tracker",
  "earbuds",
  "headphones",
  "smart tv",
  "tablet review",
  "iphone review",
];

const PROMOTIONAL_KEYWORDS = [
  "buy now",
  "shop now",
  "save 20%",
  "save 30%",
  "save 40%",
  "save 50%",
  "limited time",
  "exclusive offer",
  "special offer",
  "get yours",
  "use code",
  "promo code",
  "coupon code",
  "affiliate link",
  "sponsored post",
  "paid partnership",
  "in collaboration with",
  "best prices on",
  "lowest price",
  "check out this",
  "grab yours",
  "order now",
  "pre-order now",
  "review: should you buy",
];
function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();

  if (normalizedKeyword.includes(" ")) {
    return normalizedText.includes(normalizedKeyword);
  }

  const escapedKeyword = normalizedKeyword.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  return new RegExp(`\\b${escapedKeyword}\\b`, "i").test(normalizedText);
}

function getArticleText(article: NormalizedNewsArticle): string {
  return `${article.title} ${article.description ?? ""}`.toLowerCase();
}

function isExcluded(article: NormalizedNewsArticle): boolean {
  const text = getArticleText(article);

  return EXCLUDED_KEYWORDS.some((keyword) => containsKeyword(text, keyword));
}

function isPromotional(article: NormalizedNewsArticle): boolean {
  const text = getArticleText(article);

  return PROMOTIONAL_KEYWORDS.some((keyword) => containsKeyword(text, keyword));
}

export function filterRelevantArticles(
  articles: NormalizedNewsArticle[],
): NormalizedNewsArticle[] {
  return articles.filter((article) => {
    if (isExcluded(article)) return false;
    if (isPromotional(article)) return false;

    return true;
  });
}
