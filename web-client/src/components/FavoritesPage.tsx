import React from 'react';
import { Heart, BookOpen } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { NewsArticle } from '../types';

interface FavoritesPageProps {
  articles: NewsArticle[];
  onArticleClick: (article: NewsArticle) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ articles, onArticleClick }) => {
  if (articles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-gray-500 dark:text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Favorites Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start exploring articles and save your favorites by clicking the heart icon on any article card.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <BookOpen className="h-4 w-4" />
              <span>Tip: Your favorite articles will appear here for easy access later</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Heart className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Favorites
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'} saved for later reading
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {articles.map(article => (
          <NewsCard
            key={article.id}
            article={article}
            onClick={() => onArticleClick(article)}
            layout="vertical"
          />
        ))}
      </div>
    </div>
  );
};