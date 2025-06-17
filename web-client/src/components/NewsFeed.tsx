import React, { useState } from 'react';
import { NewsCard } from './NewsCard';
import { LoadingSpinner } from './LoadingSpinner';
import { NewsArticle } from '../types';

interface NewsFeedProps {
  articles: NewsArticle[];
  onArticleClick: (article: NewsArticle) => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ articles, onArticleClick }) => {
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayedArticles, setDisplayedArticles] = useState(10);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDisplayedArticles(prev => prev + 10);
    setLoadingMore(false);
  };

  const visibleArticles = articles.slice(0, displayedArticles);
  const hasMore = displayedArticles < articles.length;

  if (articles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📰</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No articles found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filters to find more content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Latest News
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'} found
        </p>
      </div>

      {/* Single Column Layout */}
      <div className="space-y-6">
        {visibleArticles.map(article => (
          <NewsCard
            key={article.id}
            article={article}
            onClick={() => onArticleClick(article)}
            layout="horizontal"
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-12">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loadingMore ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="small" />
                <span>Loading...</span>
              </div>
            ) : (
              'Load More Articles'
            )}
          </button>
        </div>
      )}
    </div>
  );
};