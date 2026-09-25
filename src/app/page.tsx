"use client";

import PushNotificationButton from "@/components/push/PushNotificationButton";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";

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
  const [scrollProgress, setScrollProgress] = useState(0);

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

  // Keyboard navigation (Left / Right arrows)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((index) => Math.max(0, index - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((index) => Math.min(articles.length - 1, index + 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [articles.length]);

  // Scroll progress tracker for current article
  useEffect(() => {
    function handleScroll() {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentIndex]);

  // Reset scroll position on article change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);

  if (loading) {
    return (
      <main className="reader loading-screen">
        <div className="loading-logo">S</div>
        <h1>Sync24</h1>
        <div className="loading-spinner" aria-hidden="true" />
        <p>Loading today's edition...</p>
      </main>
    );
  }

  if (error || articles.length === 0) {
    return (
      <main className="reader">
        <h1>Sync24 — Latest Tech & AI News</h1>
        <p>
          Stay updated with the latest technology, AI, software and IT news from
          the last 24 hours.
        </p>
        <p>{error || "No articles available."}</p>
      </main>
    );
  }

  const article = articles[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === articles.length - 1;
  const articleContent = article.content;

  // Format published time cleanly if available
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <main className="reader">
      <div className="article-list-pill">
        <span className="article-list-icon">☰</span>

        <div className="article-list-popup">
          {articles.map((article, index) => (
            <button
              key={article.id}
              type="button"
              className={`article-list-item ${
                index === currentIndex ? "active" : ""
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              <span className="article-list-number">{index + 1}</span>

              <span className="article-list-title">{article.title}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Reading Progress Bar */}
      <div
        className="reading-progress-bar"
        style={{ width: `${scrollProgress}%` }}
      />

      <Header
        currentIndex={currentIndex}
        totalArticles={articles.length}
        isFirst={isFirst}
        isLast={isLast}
        onPrevious={() => setCurrentIndex((index) => index - 1)}
        onNext={() => setCurrentIndex((index) => index + 1)}
      />

      <article className="article">
        <div className="article-meta">
          <span className="source-pill">{article.source_name}</span>
          {article.category && (
            <span className="category-text"> · {article.category}</span>
          )}
          {formattedDate && (
            <span className="date-text"> · {formattedDate}</span>
          )}
        </div>

        <h2>{article.title}</h2>

        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            className="article-image"
          />
        )}

        <div className="article-content-wrapper">
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
        </div>
      </article>
    </main>
  );
}
