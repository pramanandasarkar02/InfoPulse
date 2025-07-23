import React, { useState, useEffect } from 'react';
import { NewsCard } from './NewsCard';
import { LoadingSpinner } from './LoadingSpinner';
import { NewsArticle, Category } from '../types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { NewsApiService } from '../services/newsApi';

interface NewsFeedProps {
  onArticleClick: (article: NewsArticle) => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ onArticleClick }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedArticles, setDisplayedArticles] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);

  const getUserId = (): string | null => {
    try {
      return localStorage.getItem('infopulse_user_id') || user?.id || null;
    } catch (error) {
      console.error('Error retrieving user ID from localStorage:', error);
      return user?.id || null;
    }
  };

  const fetchNewsFeed = async () => {
    setLoading(true);
    setError(null);
    const userId = getUserId();
    try {
      let fetchedArticles: NewsArticle[] = [];
      if (isAuthenticated && userId) {
        // Fetch personalized recommendations for authenticated users
        fetchedArticles = await NewsApiService.fetchRecommendations(userId);
        // Fetch user categories
        const userCategories = await NewsApiService.fetchCategories(userId);
        setCategories(userCategories);
      } else {
        // Fetch general articles for unauthenticated users
        fetchedArticles = await NewsApiService.fetchArticles();
      }
      setArticles(fetchedArticles);
    } catch (err) {
      setError('Failed to load news feed. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async (articleId: string) => {
    const userId = getUserId();
    if (!isAuthenticated || !userId) {
      setError('Please log in to save articles.');
      return;
    }
    const success = await NewsApiService.saveArticle(userId, articleId);
    if (success) {
      setArticles((prev) =>
        prev.map((article) =>
          article.id === articleId ? { ...article, isFavorited: true } : article
        )
      );
    } else {
      setError('Failed to save article. Please try again.');
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
    setDisplayedArticles((prev) => prev + 10);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchNewsFeed();
  }, [isAuthenticated, user?.id]);

  const visibleArticles = articles.slice(0, displayedArticles);
  const hasMore = displayedArticles < articles.length;

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <LoadingSpinner size="large" className="mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {authLoading ? 'Authenticating...' : 'Loading your personalized news feed...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to Load News
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchNewsFeed}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📰</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No articles found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isAuthenticated
                ? 'No articles match your preferences. Try adjusting your categories.'
                : 'Try searching for articles or log in for personalized recommendations.'}
            </p>
            <button
              onClick={fetchNewsFeed}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isAuthenticated ? 'Your Personalized News' : 'Latest News'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'} found
          {isAuthenticated && categories.length > 0 && (
            <span>
              {' '}
              in {categories.map((c) => c.name).join(', ')}
            </span>
          )}
        </p>
      </div>

      {/* show user id and categories
      {isAuthenticated && (
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400">
            User ID: {user?.id}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Categories: {categories.map((c) => c.name).join(', ')}
          </p>
        </div>
      )} */}

      <div className="space-y-6">
        {visibleArticles.map((article) => (
          <NewsCard
            key={article.id}
            article={article}
            onClick={() => onArticleClick(article)}
            // onSave={() => handleSaveArticle(article.id)}
            layout="horizontal"
            // userId={getUserId()}
          />
        ))}
      </div>

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