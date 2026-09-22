import type { ClassifiedNewsArticle } from "@/types/news";
import { newsSources } from "@/config/news-sources";

interface RankedArticle extends ClassifiedNewsArticle {
  relevanceScore: number;
  importanceScore: number;
  sourceQualityScore: number;
  freshnessScore: number;
  popularityScore: number;
  diversityScore: number;
  audienceValueScore: number;
  finalScore: number;
}

/* =========================================================
   HELPERS
========================================================= */

function matchesKeyword(text: string, keyword: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase().trim();

  if (!normalizedKeyword) {
    return false;
  }

  // Multi-word phrases can be matched directly.
  if (normalizedKeyword.includes(" ")) {
    return normalizedText.includes(normalizedKeyword);
  }

  // Single words use word boundaries.
  const escapedKeyword = normalizedKeyword.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  return new RegExp(`\\b${escapedKeyword}\\b`, "i").test(normalizedText);
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.filter((keyword) => matchesKeyword(text, keyword)).length;
}

function getArticleText(article: ClassifiedNewsArticle): {
  title: string;
  description: string;
  combined: string;
} {
  const title = article.title.toLowerCase();
  const description = (article.description ?? "").toLowerCase();

  return {
    title,
    description,
    combined: `${title} ${description}`,
  };
}

/* =========================================================
   RELEVANCE SCORE
   Maximum: 30

   Measures:
   "Is this actually the kind of technology story
   Sync24 wants?"
========================================================= */

function calculateRelevance(article: ClassifiedNewsArticle): number {
  const { title, description, combined } = getArticleText(article);

  const strongSignals = [
    // AI
    "artificial intelligence",
    "machine learning",
    "large language model",
    "llm",
    "ai model",
    "ai agent",
    "ai agents",
    "generative ai",
    "artificial general intelligence",
    "agi",
    "multimodal ai",
    "multi-agent system",
    "multi-agent systems",
    "autonomous agent",
    "autonomous agents",
    "world model",
    "world models",
    "edge ai",
    "open-source ai",
    "open source ai",
    "open-weight model",
    "open weight model",
    "synthetic data",
    "ai scientist",
    "ai scientists",
    "ai ethics",
    "algorithmic bias",
    "white-collar automation",

    // AI companies / ecosystems
    "openai",
    "google deepmind",
    "anthropic",
    "meta ai",
    "hugging face",
    "mistral ai",
    "google cloud",
    "gcp",

    // AI hardware / infrastructure
    "ai chip",
    "ai chips",
    "gpu",
    "gpus",
    "tpu",
    "tpu",
    "semiconductor",
    "semiconductor manufacturing",
    "data center",
    "data center construction",
    "data centre",
    "data centre construction",

    // Robotics / emerging technology
    "humanoid robot",
    "humanoid robots",
    "embodied ai",
    "exoskeleton",
    "exoskeletons",
    "spatial computing",
    "quantum computing",
    "solid-state drive",
    "solid-state drives",
    "ssd",
    "ssds",
    "neuromorphic chip",
    "neuromorphic chips",
    "protein synthesis",

    // Software / infrastructure
    "software development",
    "programming",
    "developer",
    "developers",
    "github",
    "kubernetes",
    "docker",
    "cloud computing",
    "cloud infrastructure",
    "database",
    "databases",
    "open source",
    "open-source",

    // Security
    "cybersecurity",
    "cyber security",
    "cybersecurity vulnerability",
    "cybersecurity vulnerabilities",
    "security vulnerability",
    "security vulnerabilities",
    "zero-day",
    "zero day",
    "zero trust",
    "zero-trust architecture",

    // Networks / regulation
    "5g",
    "6g",
    "ai regulation",
    "eu ai act",
    "deepfake",
    "deepfakes",
    "synthetic media",

    // Technology industry
    "tech layoffs",
    "venture capital funding",

    // Cloud / infrastructure
    "multi-cloud",
    "multicloud",
    "hybrid cloud",
    "hybridcloud",
    "sovereign cloud",
    "ai-as-a-service",
    "ai as a service",
    "gpu-as-a-service",
    "gpu as a service",
    "finops",
    "cloud cost optimization",
    "cloud cost management",
    "serverless computing",
    "serverless",
    "confidential computing",
    "zero-trust cloud security",
    "zero trust cloud security",
    "data gravity",
    "platform engineering",
    "internal developer platform",
    "internal developer platforms",
    "idp",
    "infrastructure as code",
    "iac",
    "aiops",
    "devsecops",
    "green data center",
    "green data centers",
    "sustainable cloud computing",
    "edge-cloud integration",
    "edge cloud integration",
    "cloud hyperscaler",
    "cloud hyperscalers",
    "hyperscaler",
  ];

  const technologySignals = [
    "software",
    "technology",
    "tech",
    "api",
    "framework",
    "cloud",
    "aws",
    "azure",
    "android",
    "ios",
    "chrome",
    "windows",
    "macos",
    "iphone",
    "ipad",
    "macbook",
    "server",
    "data center",
    "data centre",
    "developer tools",
    "coding",
    "programming language",
    "operating system",
    "browser",
    "chip",
    "hardware",
    "smartphone",
    "laptop",
    "robotics",
  ];

  const exclusionSignals = [
    "politics",
    "political",
    "president",
    "election",
    "trump",
    "congress",
    "senate",

    "celebrity",
    "hollywood",

    "sports",
    "football",
    "basketball",
    "baseball",
    "soccer",

    "fashion",
    "restaurant",
    "food",
    "travel",
    "tourism",

    "healthcare",
    "medical",
    "medicine",
    "wellness",
    "hospital",
    "clinical",

    "automotive",
    "automobile",
    "carplay",
    "carmaker",
  ];

  const promotionalSignals = [
    "register now",
    "tickets",
    "join us",
    "event",
    "conference",
    "webinar",
    "sponsored",
    "sponsor",
    "disrupt2026",
    "disrupt2025",
    "sign up",
    "signup",
  ];

  const strongTitleMatches = countMatches(title, strongSignals);

  const strongDescriptionMatches = countMatches(description, strongSignals);

  const technologyTitleMatches = countMatches(title, technologySignals);

  const technologyDescriptionMatches = countMatches(
    description,
    technologySignals,
  );

  const exclusionMatches = countMatches(combined, exclusionSignals);

  const promotionalMatches = countMatches(combined, promotionalSignals);

  let score = 0;

  /*
   * STRONG TECHNOLOGY CONTENT
   *
   * Title matches are weighted more heavily because
   * the headline usually tells us what the story is about.
   */
  if (strongTitleMatches >= 3) {
    score = 30;
  } else if (strongTitleMatches === 2) {
    score = 28;
  } else if (strongTitleMatches === 1) {
    score = 25;
  } else if (strongDescriptionMatches >= 2) {
    score = 22;
  } else if (strongDescriptionMatches === 1) {
    score = 18;
  }

  /*
   * GENERAL TECHNOLOGY CONTENT
   */
  if (score === 0) {
    if (technologyTitleMatches >= 4) {
      score = 24;
    } else if (technologyTitleMatches >= 2) {
      score = 20;
    } else if (
      technologyTitleMatches === 1 ||
      technologyDescriptionMatches >= 2
    ) {
      score = 12;
    }
  }

  /*
   * BUSINESS / FUNDING STORIES
   *
   * A funding announcement should not become a top
   * technology story just because it contains words
   * like "startup", "funding", or "valuation".
   */
  const businessSignals = [
    "funding",
    "raises",
    "raised",
    "valuation",
    "series a",
    "series b",
    "series c",
    "series d",
    "venture capital",
  ];

  const businessMatches = countMatches(combined, businessSignals);

  if (
    businessMatches > 0 &&
    strongTitleMatches === 0 &&
    strongDescriptionMatches === 0 &&
    technologyTitleMatches <= 1
  ) {
    score = Math.min(score, 10);
  }

  /*
   * NON-TECHNOLOGY PENALTY
   */
  score -= exclusionMatches * 10;

  /*
   * PROMOTIONAL CONTENT PENALTY
   */
  score -= promotionalMatches * 12;

  return Math.max(0, Math.min(30, score));
}

/* =========================================================
   IMPORTANCE SCORE
   Maximum: 30

   Measures:
   "How important is this event to the technology
   industry, companies, developers, or users?"
========================================================= */

function calculateImportance(article: ClassifiedNewsArticle): number {
  const { title, combined } = getArticleText(article);

  /*
   * 1. CRITICAL
   */
  const criticalSignals = [
    "critical vulnerability",
    "security vulnerability",
    "cybersecurity vulnerability",
    "zero-day",
    "zero day",
    "actively exploited",
    "active exploitation",
    "data breach",
    "security breach",
    "ransomware attack",
    "major cyber attack",
    "major cyberattack",
    "major outage",
    "mass outage",
    "global outage",
  ];

  if (countMatches(title, criticalSignals) > 0) {
    return 30;
  }

  /*
   * 2. MAJOR INDUSTRY EVENTS
   */
  const majorSignals = [
    // AI
    "artificial general intelligence",
    "agi",
    "new ai model",
    "new language model",
    "new large language model",
    "frontier model",
    "major ai model",
    "major ai release",
    "ai breakthrough",
    "major ai research",

    // Companies / platforms
    "acquisition",
    "acquires",
    "acquired by",
    "merger",

    // Infrastructure
    "major cloud outage",
    "cloud outage",
    "data center shutdown",
    "data centre shutdown",
    "major data center",
    "major data centre",

    // Hardware
    "new gpu",
    "new ai chip",
    "new processor",
    "new semiconductor",
    "chip breakthrough",

    // Regulation
    "ai regulation",
    "eu ai act",
    "antitrust ruling",
    "antitrust lawsuit",
    "antitrust case",
    "regulatory ruling",
    "regulatory decision",
  ];

  if (countMatches(title, majorSignals) > 0) {
    return 26;
  }

  /*
   * 3. HIGH IMPACT
   */
  const highImpactSignals = [
    // AI
    "new model",
    "new ai system",
    "new ai agent",
    "new ai agents",
    "multimodal model",
    "open-source ai model",
    "open-weight model",
    "open source model",
    "ai research",
    "ai scientist",

    // Security
    "security flaw",
    "security update",
    "security patch",
    "vulnerability",
    "hack",
    "hacked",
    "cyber attack",
    "cyberattack",

    // Cloud / infrastructure
    "cloud computing",
    "cloud infrastructure",
    "serverless",
    "kubernetes",
    "platform engineering",
    "infrastructure as code",
    "devsecops",

    // Hardware
    "new gpu",
    "new cpu",
    "new chip",
    "new semiconductor",
    "humanoid robot",
    "quantum computing",

    // Product / platform
    "launches",
    "launches new",
    "product launch",
    "major update",
    "major new feature",

    // Business
    "raises",
    "raises funding",
    "raises millions",
    "raises billions",
    "venture capital",
  ];

  const highImpactMatches = countMatches(combined, highImpactSignals);

  if (highImpactMatches >= 2) {
    return 22;
  }

  if (highImpactMatches === 1) {
    return 18;
  }

  /*
   * 4. MEDIUM IMPACT
   */
  const mediumImpactSignals = [
    "funding",
    "investment",
    "new feature",
    "feature update",
    "software update",
    "announces",
    "announcement",
    "partnership",
    "integration",
    "developer tool",
    "developer platform",
    "api update",
    "cloud service",
    "new device",
    "new laptop",
    "new smartphone",
  ];

  const mediumImpactMatches = countMatches(combined, mediumImpactSignals);

  if (mediumImpactMatches >= 2) {
    return 13;
  }

  if (mediumImpactMatches === 1) {
    return 9;
  }

  /*
   * 5. ORDINARY TECHNOLOGY STORY
   */
  return 4;
}

/* =========================================================
   AUDIENCE VALUE SCORE
   Maximum: 25

   Measures:
   "Would a Sync24 reader actually care about this
   beyond simply knowing that it happened?"
========================================================= */

function calculateAudienceValue(article: ClassifiedNewsArticle): number {
  const { title, combined } = getArticleText(article);

  const highValueSignals = [
    // AI
    "ai",
    "artificial intelligence",
    "ai agent",
    "ai agents",
    "llm",
    "large language model",
    "ai model",
    "generative ai",
    "open source ai",
    "open-weight model",

    // Security
    "security",
    "cybersecurity",
    "vulnerability",
    "zero-day",
    "zero day",
    "hack",
    "hacked",
    "breach",
    "ransomware",

    // Infrastructure
    "cloud",
    "kubernetes",
    "docker",
    "data center",
    "data centre",
    "gpu",
    "semiconductor",
    "server",

    // Developer
    "developer",
    "developers",
    "github",
    "api",
    "programming",
    "software",

    // Major technology companies
    "openai",
    "google",
    "deepmind",
    "anthropic",
    "microsoft",
    "meta",
    "apple",
    "nvidia",
    "amazon",
  ];

  const practicalSignals = [
    "new feature",
    "feature update",
    "software update",
    "security update",
    "security patch",
    "launches",
    "new model",
    "new ai model",
    "new tool",
    "developer tool",
    "api",
    "open source",
    "open-source",
    "platform",
    "cloud service",
  ];

  const lowValueSignals = [
    "review",
    "best",
    "tested",
    "coupon",
    "promo code",
    "discount",
    "deals",
    "event",
    "webinar",
    "conference",
    "live recording",
  ];

  const highValueTitleMatches = countMatches(title, highValueSignals);

  const practicalMatches = countMatches(combined, practicalSignals);

  const lowValueTitleMatches = countMatches(title, lowValueSignals);

  let score = 0;

  /*
   * Headline signals are more valuable than description
   * signals because they indicate the actual subject.
   */
  score += Math.min(18, highValueTitleMatches * 6);

  score += Math.min(9, practicalMatches * 3);

  /*
   * Product reviews, buying guides, events, etc.
   * generally provide less daily-news value.
   */
  if (lowValueTitleMatches > 0) {
    score -= 12;
  }

  return Math.max(0, Math.min(25, score));
}

/* =========================================================
   FRESHNESS
   Maximum: 15

   IMPORTANT:
   This is calculated for diagnostics only.

   It is NOT included in finalScore because the pipeline
   already filters candidates to the previous 24 hours.
========================================================= */

function calculateFreshness(publishedAt: string | null, now: Date): number {
  if (!publishedAt) {
    return 0;
  }

  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return 0;
  }

  const ageHours = (now.getTime() - publishedTime) / (1000 * 60 * 60);

  if (ageHours < 0 || ageHours >= 24) {
    return 0;
  }

  return Number((15 * (1 - ageHours / 24)).toFixed(2));
}

/* =========================================================
   SOURCE QUALITY
   Maximum: 15
========================================================= */

function getSourceQuality(sourceId: string): number {
  return (
    newsSources.find((source) => source.id === sourceId)?.sourceQuality ?? 0
  );
}

/* =========================================================
   MAIN RANKING FUNCTION

   Final score:

   Relevance       30
   Importance     30
   Source Quality 15
   Audience Value 25
   ----------------
   Total          100

   Freshness is deliberately excluded.
   Popularity and diversity remain placeholders for now.
========================================================= */

export function rankArticles(
  articles: ClassifiedNewsArticle[],
  now: Date = new Date(),
): RankedArticle[] {
  return articles
    .map((article) => {
      const relevanceScore = calculateRelevance(article);

      const importanceScore = calculateImportance(article);

      const sourceQualityScore = getSourceQuality(article.sourceId);

      const freshnessScore = calculateFreshness(article.publishedAt, now);

      /*
       * These are intentionally zero for V1.
       *
       * Popularity requires a real signal such as
       * Hacker News points, GitHub stars, etc.
       *
       * Diversity should be handled during selection /
       * story clustering rather than pretending that a
       * score of 5 means something meaningful.
       */
      const popularityScore = 0;
      const diversityScore = 0;

      const audienceValueScore = calculateAudienceValue(article);

      /*
       * IMPORTANT:
       *
       * Freshness is NOT included here.
       *
       * The candidate pool has already been restricted
       * to the previous 24 hours.
       */
      const finalScore =
        relevanceScore +
        importanceScore +
        sourceQualityScore +
        audienceValueScore;

      return {
        ...article,

        relevanceScore,
        importanceScore,
        sourceQualityScore,
        freshnessScore,

        popularityScore,
        diversityScore,

        audienceValueScore,

        finalScore: Number(finalScore.toFixed(2)),
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
