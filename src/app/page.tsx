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

  return (
    <main className="reader">
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
    </main>
  );
}
