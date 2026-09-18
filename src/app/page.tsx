"use client";

import { useEffect, useState } from "react";
// import sanitizeHtml from "sanitize-html";

interface Article {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  original_url: string;
  source_name: string;
  author: string | null;
  image_url: string | null;
  published_at: string | null;
  category: string | null;
  company: string | null;
  rank: number | null;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEdition() {
      try {
        const response = await fetch("/api/editions/today");

        if (!response.ok) {
          throw new Error("Today's edition is not available.");
        }

        const data = await response.json();
        setArticles(data.articles ?? []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Something went wrong.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadEdition();
  }, []);

  if (loading) {
    return (
      <main className="reader">
        <p>Loading today's edition...</p>
      </main>
    );
  }

  if (error || articles.length === 0) {
    return (
      <main className="reader">
        <h1>DailyHunt</h1>
        <p>{error || "No articles available."}</p>
      </main>
    );
  }

  const article = articles[currentIndex];

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === articles.length - 1;

  // const articleContent = article.content
  //   ? sanitizeHtml(article.content, {
  //       allowedTags: [
  //         "p",
  //         "br",
  //         "strong",
  //         "b",
  //         "em",
  //         "i",
  //         "u",
  //         "blockquote",
  //         "ul",
  //         "ol",
  //         "li",
  //         "a",
  //         "h2",
  //         "h3",
  //         "h4",
  //         "figure",
  //         "figcaption",
  //         "img",
  //       ],
  //       allowedAttributes: {
  //         a: ["href", "target", "rel"],
  //         img: ["src", "alt", "width", "height"],
  //       },
  //       allowedSchemes: ["http", "https"],
  //     })
  //   : null;
  const articleContent = article.content;
  return (
    <main className="reader">
      <header className="header">
        <h1>DailyHunt</h1>

        <span>
          {currentIndex + 1} / {articles.length}
        </span>
      </header>

      <article className="article">
        <div className="article-meta">
          <span>{article.source_name}</span>

          {article.category && <span> · {article.category}</span>}
        </div>

        <h2>{article.title}</h2>

        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            className="article-image"
          />
        )}

        {/* <div className="article-content">
          {articleContent ? (
            <div
              dangerouslySetInnerHTML={{
                __html: articleContent,
              }}
            />
          ) : (
            <p>{article.description || "No article content available."}</p>
          )}
        </div> */}
        <div className="article-content">
          {articleContent ? (
            <div dangerouslySetInnerHTML={{ __html: articleContent }} />
          ) : (
            <p>{article.description || "No article content available."}</p>
          )}
        </div>

        {article.author && <p className="author">By {article.author}</p>}

        <a
          href={article.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="original-link"
        >
          Read original article →
        </a>
      </article>

      <footer className="navigation">
        <button
          className="nav-button"
          disabled={isFirst}
          onClick={() => setCurrentIndex((index) => index - 1)}
        >
          ← Previous
        </button>

        <button
          className="nav-button"
          disabled={isLast}
          onClick={() => setCurrentIndex((index) => index + 1)}
        >
          Next →
        </button>
      </footer>
    </main>
  );
}
