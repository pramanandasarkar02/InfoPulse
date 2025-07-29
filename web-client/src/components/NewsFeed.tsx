import React, { useState, useEffect } from 'react';
import { NewsArticle, NewsCategory } from '../services/NewsService';
import { AlertCircle, RefreshCw } from 'lucide-react';
import newsService from '../services/NewsService';
import authService from '../services/AuthService';
import NewsArticleCard from './NewsArticleCard';
import NewsArticleDetails from './NewsArticleDetails';
import { LoadingSpinner } from './LoadingSpinner';

export const NewsFeed: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedArticles, setDisplayedArticles] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const getUserId = (): string | null => {
    const user = authService.getCurrentUser();
    return user ? user.userId : null;
  };

  const fetchNewsFeed = async () => {
    setLoading(true);
    setError(null);
    const userId = getUserId();

    try {
      let fetchedArticles: NewsArticle[] = [];
      const isAuthenticated = authService.isAuthenticated();

      if (isAuthenticated && userId) {
        const categoriesResult = await newsService.getCategories();
        if (categoriesResult.error) {
          console.error('Failed to fetch categories:', categoriesResult.error);
          setCategories([]);
        } else {
          setCategories(categoriesResult.data || []);
        }

        const articlesResult = await newsService.getProcessedArticles({
          limit: 50,
          sortBy: 'publishedAt',
          sortOrder: 'desc',
        });

        if (articlesResult.error) {
          throw new Error(articlesResult.error);
        } else {
          fetchedArticles = articlesResult.data?.data || [];
        }
      } else {
        const articlesResult = await newsService.getArticles({
          limit: 50,
          sortBy: 'publishedAt',
          sortOrder: 'desc',
        });

        if (articlesResult.error) {
          throw new Error(articlesResult.error);
        } else {
          fetchedArticles = articlesResult.data?.articles || [];
        }
      }
      console.log(fetchedArticles)
      setArticles(fetchedArticles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load news feed. Please try again later.';
      setError(errorMessage);
      console.error('News feed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setDisplayedArticles((prev) => prev + 10);
    setLoadingMore(false);
  };

  const handleArticleClick = (article: NewsArticle) => {
    console.log(article.url)
    setSelectedArticle(article);
  };

  const handleBack = () => {
    setSelectedArticle(null);
  };

  useEffect(() => {
    fetchNewsFeed();
  }, []);

  const visibleArticles = articles.slice(0, displayedArticles);
  const hasMore = displayedArticles < articles.length;

  if (selectedArticle) {
    return <NewsArticleDetails  articleUrl = {selectedArticle.url} articleTitle = {selectedArticle.title} onBack={handleBack} />;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <LoadingSpinner size="large" className="mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your personalized news feed...</p>
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to Load News</h3>
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No articles found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {(authService.isAuthenticated() && categories.length === 0)
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
          {authService.isAuthenticated() ? 'Your Personalized News' : 'Latest News'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'} found
          {authService.isAuthenticated() && categories.length > 0 && (
            <span> in {categories.map((c) => c.name).join(', ')}</span>
          )}
        </p>
      </div>

      {authService.isAuthenticated() && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">User ID: {authService.getUserId()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Categories: {categories.length > 0 ? categories.map((c) => c.name).join(', ') : 'None'}
          </p>
        </div>
      )}

      <div className="space-y-6 ">
        {visibleArticles.map((article) => (
          <NewsArticleCard key={Math.random()} article={article} onClick={() => handleArticleClick(article)} />
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