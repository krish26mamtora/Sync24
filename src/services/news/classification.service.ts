import type {
  ClassifiedNewsArticle,
  NormalizedNewsArticle,
} from "@/types/news";

interface ClassificationRule {
  name: string;
  keywords: string[];
}

const CATEGORY_PRIORITY: Record<string, number> = {
  Cybersecurity: 100,
  "Artificial Intelligence": 90,
  "Robotics & Emerging Tech": 80,
  "Cloud & Infrastructure": 70,
  Hardware: 60,
  "Software Development": 50,
  "Business & Startups": 40,
  Technology: 10,
};

const CATEGORY_RULES: ClassificationRule[] = [
  {
    name: "Artificial Intelligence",
    keywords: [
      "ai",
      "artificial intelligence",
      "llm",
      "large language model",
      "machine learning",
      "generative ai",
      "generative artificial intelligence",
      "ai model",
      "ai agent",
      "agents",
      "robotics",
    ],
  },
  {
    name: "Cybersecurity",
    keywords: [
      "cybersecurity",
      "cyber security",
      "security",
      "vulnerability",
      "zero-day",
      "zero day",
      "hack",
      "hacked",
      "breach",
      "malware",
      "ransomware",
      "phishing",
    ],
  },
  {
    name: "Software Development",
    keywords: [
      "developer",
      "developers",
      "programming",
      "software",
      "github",
      "api",
      "framework",
      "database",
      "linux",
      "open source",
      "coding",
    ],
  },
  {
    name: "Cloud & Infrastructure",
    keywords: [
      "cloud",
      "aws",
      "azure",
      "google cloud",
      "kubernetes",
      "docker",
      "server",
      "datacenter",
      "data center",
      "infrastructure",
    ],
  },
  {
    name: "Robotics & Emerging Tech",
    keywords: [
      "robot",
      "robots",
      "robotics",
      "humanoid",
      "humanoid robot",
      "embodied ai",
      "exoskeleton",
      "spatial computing",
      "virtual reality",
      "augmented reality",
      "mixed reality",
      "quantum computing",
      "quantum computer",
      "neuromorphic",
    ],
  },
  {
    name: "Hardware",
    keywords: [
      "chip",
      "chips",
      "processor",
      "cpu",
      "gpu",
      "semiconductor",
      "hardware",
      "device",
      "laptop",
      "smartphone",
    ],
  },
  {
    name: "Business & Startups",
    keywords: [
      "startup",
      "funding",
      "raises",
      "raised",
      "investment",
      "acquisition",
      "acquires",
      "valuation",
      "unicorn",
    ],
  },
];

const COMPANY_RULES: ClassificationRule[] = [
  {
    name: "Microsoft",
    keywords: ["microsoft", "windows", "azure", "xbox", "copilot"],
  },
  {
    name: "Google",
    keywords: ["google", "android", "chrome", "gemini", "youtube"],
  },
  {
    name: "Google DeepMind",
    keywords: ["google deepmind", "deepmind", "gemini"],
  },
  {
    name: "AMD",
    keywords: ["amd", "ryzen", "radeon", "epyc"],
  },
  {
    name: "Intel",
    keywords: ["intel", "core ultra", "xeon", "arc gpu"],
  },
  {
    name: "Qualcomm",
    keywords: ["qualcomm", "snapdragon"],
  },
  {
    name: "IBM",
    keywords: ["ibm", "watson", "red hat"],
  },
  {
    name: "Salesforce",
    keywords: ["salesforce", "salesforce crm", "agentforce", "slack"],
  },
  {
    name: "ServiceNow",
    keywords: ["servicenow"],
  },
  {
    name: "Cisco",
    keywords: ["cisco", "splunk"],
  },
  {
    name: "Adobe",
    keywords: ["adobe", "photoshop", "firefly"],
  },
  {
    name: "Tesla",
    keywords: ["tesla", "full self-driving", "fsd", "optimus"],
  },
  {
    name: "SpaceX",
    keywords: ["spacex", "starlink"],
  },
  {
    name: "Cohere",
    keywords: ["cohere", "command r"],
  },
  {
    name: "Perplexity",
    keywords: ["perplexity", "perplexity ai"],
  },
  {
    name: "Stability AI",
    keywords: ["stability ai", "stable diffusion"],
  },
  {
    name: "xAI",
    keywords: ["xai", "grok"],
  },
  {
    name: "ByteDance",
    keywords: ["bytedance", "tiktok"],
  },
  {
    name: "Palantir",
    keywords: ["palantir", "foundry", "gotham"],
  },
  {
    name: "Snowflake",
    keywords: ["snowflake"],
  },
  {
    name: "Datadog",
    keywords: ["datadog"],
  },
  {
    name: "MongoDB",
    keywords: ["mongodb"],
  },
  {
    name: "Google DeepMind",
    keywords: ["google deepmind", "deepmind", "gemini"],
  },
  {
    name: "Hugging Face",
    keywords: ["hugging face", "huggingface"],
  },
  {
    name: "Mistral AI",
    keywords: ["mistral ai", "mistral"],
  },
  {
    name: "Oracle",
    keywords: ["oracle", "oracle cloud"],
  },
  {
    name: "NVIDIA",
    keywords: ["nvidia", "geforce", "cuda"],
  },
  {
    name: "Apple",
    keywords: ["apple", "iphone", "ipad", "macbook", "ios", "macos", "airpods"],
  },
  {
    name: "OpenAI",
    keywords: ["openai", "chatgpt", "gpt-", "gpt "],
  },
  {
    name: "Anthropic",
    keywords: ["anthropic", "claude"],
  },
  {
    name: "Meta",
    keywords: ["meta", "facebook", "instagram", "whatsapp", "llama"],
  },
  {
    name: "NVIDIA",
    keywords: ["nvidia", "geforce", "cuda"],
  },
  {
    name: "Amazon",
    keywords: ["amazon", "aws", "alexa"],
  },
  {
    name: "GitHub",
    keywords: ["github"],
  },
];

function getArticleText(article: NormalizedNewsArticle): string {
  return `${article.title} ${article.description ?? ""}`.toLowerCase();
}

function matchesKeyword(text: string, keyword: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase().trim();

  if (!normalizedKeyword) return false;

  // Phrases can safely use includes.
  if (normalizedKeyword.includes(" ")) {
    return normalizedText.includes(normalizedKeyword);
  }

  // Single words need word-boundary matching.
  const escapedKeyword = normalizedKeyword.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const regex = new RegExp(`\\b${escapedKeyword}\\b`, "i");

  return regex.test(normalizedText);
}

function calculateRuleScore(text: string, rule: ClassificationRule): number {
  return rule.keywords.filter((keyword) => matchesKeyword(text, keyword))
    .length;
}

function classifyCategory(article: NormalizedNewsArticle): string {
  const title = article.title.toLowerCase();
  const description = (article.description ?? "").toLowerCase();

  let bestCategory = "Technology";
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    const titleScore = calculateRuleScore(title, rule);
    const descriptionScore = calculateRuleScore(description, rule);

    let score = titleScore * 3 + descriptionScore;

    // Give strong category signals additional weight.
    if (rule.name === "Cybersecurity" && matchesKeyword(title, "hack")) {
      score += 5;
    }

    if (rule.name === "Cybersecurity" && matchesKeyword(title, "hacker")) {
      score += 5;
    }

    if (rule.name === "Cybersecurity" && matchesKeyword(title, "breach")) {
      score += 5;
    }

    if (rule.name === "Hardware" && matchesKeyword(title, "iphone")) {
      score += 5;
    }

    if (rule.name === "Hardware" && matchesKeyword(title, "smartphone")) {
      score += 5;
    }

    if (rule.name === "Hardware" && matchesKeyword(title, "laptop")) {
      score += 5;
    }

    if (
      rule.name === "Robotics & Emerging Tech" &&
      matchesKeyword(title, "humanoid")
    ) {
      score += 5;
    }

    if (
      rule.name === "Robotics & Emerging Tech" &&
      matchesKeyword(title, "robot")
    ) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = rule.name;
    }
  }

  return bestCategory;
}

function classifyCompany(article: NormalizedNewsArticle): string | null {
  const title = article.title.toLowerCase();
  const description = (article.description ?? "").toLowerCase();

  let bestCompany: string | null = null;
  let bestScore = 0;

  for (const rule of COMPANY_RULES) {
    const titleScore = calculateRuleScore(title, rule);
    const descriptionScore = calculateRuleScore(description, rule);

    const score = titleScore * 5 + descriptionScore;

    if (score > bestScore) {
      bestScore = score;
      bestCompany = rule.name;
    }
  }

  return bestCompany;
}
function extractTopics(article: NormalizedNewsArticle): string[] {
  const text = getArticleText(article);
  const topics = new Set<string>();

  const topicRules: Record<string, string[]> = {
    AI: ["ai", "artificial intelligence", "llm", "machine learning"],
    Security: ["security", "cybersecurity", "vulnerability", "breach", "hack"],
    Cloud: ["cloud", "aws", "azure", "kubernetes", "docker"],
    Developers: ["developer", "programming", "github", "software", "api"],
    Hardware: ["chip", "processor", "gpu", "hardware", "device"],
    Funding: [
      "funding",
      "raises",
      "raised",
      "investment",
      "million",
      "billion",
    ],
    Startups: ["startup", "unicorn", "valuation"],
    OpenSource: ["open source", "open-source", "github"],
  };

  for (const [topic, keywords] of Object.entries(topicRules)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      topics.add(topic);
    }
  }

  return Array.from(topics);
}

export function classifyArticle(
  article: NormalizedNewsArticle,
): ClassifiedNewsArticle {
  return {
    ...article,
    category: classifyCategory(article),
    company: classifyCompany(article),
    topics: extractTopics(article),
  };
}

export function classifyArticles(
  articles: NormalizedNewsArticle[],
): ClassifiedNewsArticle[] {
  return articles.map(classifyArticle);
}
