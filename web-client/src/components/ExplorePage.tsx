import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, Globe, Filter } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { LoadingSpinner } from './LoadingSpinner';
import { NewsArticle, SearchFilters } from '../types';
import { categories } from '../data/mockNews';

interface ExplorePageProps {
  articles: NewsArticle[];
  onArticleClick: (article: NewsArticle) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ articles, onArticleClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'trending' | 'popular'>('newest');
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayedArticles, setDisplayedArticles] = useState(12);

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        article =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.toLowerCase().includes(query)) ||
          article.author.toLowerCase().includes(query) ||
          article.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== '') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'trending':
          // Mock trending based on read time and recency
          const aTrending = (10 - a.readTime) + (new Date(a.publishedAt).getTime() / 1000000000);
          const bTrending = (10 - b.readTime) + (new Date(b.publishedAt).getTime() / 1000000000);
          return bTrending - aTrending;
        case 'popular':
          // Mock popularity based on tags count and read time
          return (b.tags.length * b.readTime) - (a.tags.length * a.readTime);
        default:
          return 0;
      }
    });

    return filtered;
  }, [articles, searchQuery, selectedCategory, sortBy]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDisplayedArticles(prev => prev + 12);
    setLoadingMore(false);
  };

  const visibleArticles = filteredArticles.slice(0, displayedArticles);
  const hasMore = displayedArticles < filteredArticles.length;

  const trendingTopics = ['AI', 'Climate', 'Technology', 'Healthcare', 'Space', 'Finance'];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Explore News
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Discover the latest stories from around the world
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
        <div className="space-y-6">
          {/* Search Bar */}
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

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <div className="flex space-x-1">
                {[
                  { value: 'newest', label: 'Newest' },
                  { value: 'trending', label: 'Trending' },
                  { value: 'popular', label: 'Popular' },
                ].map(option => (
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

          {/* Trending Topics */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trending Topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map(topic => (
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
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory && ` in ${selectedCategory}`}
        </p>
      </div>

      {/* Articles Grid */}
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
          {visibleArticles.map(article => (
            <NewsCard
              key={article.id}
              article={article}
              onClick={() => onArticleClick(article)}
              layout="vertical"
            />
          ))}
        </div>
      )}

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