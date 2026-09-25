"use client";

import PushNotificationButton from "@/components/push/PushNotificationButton";

interface HeaderProps {
  currentIndex: number;
  totalArticles: number;
  isFirst: boolean;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function Header({
  currentIndex,
  totalArticles,
  isFirst,
  isLast,
  onPrevious,
  onNext,
}: HeaderProps) {
  return (
    <header className="header">
      {/* Left */}
      <div className="header-left">
        <span className="header-logo">Sync24</span>
      </div>

      {/* Center */}
      <div className="header-navigation">
        <button
          className="header-nav-button"
          disabled={isFirst}
          onClick={onPrevious}
          aria-label="Previous article (Left Arrow)"
          title="Previous article (←)"
        >
          ←
        </button>

        <span className="page-number">
          {currentIndex + 1} / {totalArticles}
        </span>

        <button
          className="header-nav-button"
          disabled={isLast}
          onClick={onNext}
          aria-label="Next article (Right Arrow)"
          title="Next article (→)"
        >
          →
        </button>
      </div>

      {/* Right */}
      <div className="header-right">
        <PushNotificationButton />
      </div>
    </header>
  );
}
