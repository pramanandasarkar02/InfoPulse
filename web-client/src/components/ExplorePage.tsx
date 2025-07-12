import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, Globe, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { LoadingSpinner } from './LoadingSpinner';
import { NewsArticle } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ExplorePageProps {
  articles: NewsArticle[];
  onArticleClick: (article: NewsArticle) => void;
  availableCategories: string[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  articles,
  onArticleClick,
  availableCategories,
  loading = false,
  error = null,
  onRefresh,
}) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'trending' | 'popular'>('newest');
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayedArticles, setDisplayedArticles] = useState(12);

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          article.author.toLowerCase().includes(query) ||
          article.category.toLowerCase().includes(query) ||
          article.source.toLowerCase().includes(query)
      );
    }

    if (selectedCategory && selectedCategory !== '') {
      filtered = filtered.filter((article) => article.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'trending':
          const aTrending = (10 - a.readTime) + new Date(a.publishedAt).getTime() / 1000000000;
          const bTrending = (10 - b.readTime) + new Date(b.publishedAt).getTime() / 1000000000;
          return bTrending - aTrending;
        case 'popular':
          return b.tags.length * b.readTime - a.tags.length * a.readTime;
        default:
          return 0;
      }
    });

    return filtered;
  }, [articles, searchQuery, selectedCategory, sortBy]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setDisplayedArticles((prev) => prev + 12);
    setLoadingMore(false);
  };

  const visibleArticles = filteredArticles.slice(0, displayedArticles);
  const hasMore = displayedArticles < filteredArticles.length;

  const trendingTopics = useMemo(() => {
    const tagCounts: { [key: string]: number } = {};
    articles.forEach((article) => {
      article.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [articles]);

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <LoadingSpinner size="large" className="mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {authLoading ? 'Authenticating...' : 'Loading latest news...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to Load News
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Globe className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Explore News
            </h1>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Discover the latest stories from around the world
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, topics, authors..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <div className="flex space-x-1">
                {[
                  { value: 'newest', label: 'Newest' },
                  { value: 'trending', label: 'Trending' },
                  { value: 'popular', label: 'Popular' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                      sortBy === option.value
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {trendingTopics.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trending Topics</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSearchQuery(topic)}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    #{topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory && ` in ${selectedCategory}`}
        </p>
      </div>

      {visibleArticles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No articles found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms or filters to find more content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleArticles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onClick={() => onArticleClick(article)}
              layout="vertical"
              userId={user?.id || undefined}
            />
          ))}
        </div>
      )}

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