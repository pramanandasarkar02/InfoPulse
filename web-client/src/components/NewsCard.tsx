import React, { useState, useEffect, useRef } from 'react';
import { Heart, Clock, BookOpen, Star, Calendar } from 'lucide-react';
import { NewsArticle } from '../types';
import { addToFavorites, removeFromFavorites, rateRecommendation } from '../utils/localStorage';
import axios from 'axios';

interface NewsCardProps {
  article: NewsArticle;
  onClick: () => void;
  layout?: 'vertical' | 'horizontal';
  userId?: string;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  onClick,
  layout = 'vertical',
  userId,
}) => {
  const [isFavorited, setIsFavorited] = useState(article.isFavorited || false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const isReadingRef = useRef(false);

  // Log article click
  const handleClick = async () => {
    console.log('NewsCard clicked:', { articleId: article.id, userId });
    try {
      if (userId) {
        const userIdStr = userId.toString();
        console.log(`Sending click log for user ${userId} and article ${article.id}`);
        const response = await axios.post('http://localhost:3006/article/click', {
          userId: userIdStr,
          articleId: article.id,
        });
        console.log(`Click logged successfully for article ${article.id}`, response.data);
      } else {
        console.warn('No userId provided, skipping click log');
      }
      isReadingRef.current = true;
      console.log(`Set isReading to true for article ${article.id}`);
      onClick();
    } catch (error: any) {
      console.error(`Failed to log click for article ${article.id}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  };

  // Log reading time every 10 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isReadingRef.current && userId) {
      console.log(`Starting reading time tracking for user ${userId} and article ${article.id}`);
      interval = setInterval(async () => {
        try {
          console.log(`Sending reading log for user ${userId} and article ${article.id}`);
          const response = await axios.post('http://localhost:3006/article/reading', {
            userId: userId.toString(),
            articleId: article.id,
          });
          console.log(`Reading time logged successfully for article ${article.id}`, response.data);
        } catch (error: any) {
          console.error(`Failed to log reading time for article ${article.id}:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
        }
      }, 10000);
    }

    return () => {
      if (interval) {
        console.log(`Cleanup: Stopping reading time tracking for article ${article.id}`);
        clearInterval(interval);
      }
    };
  }, [userId, article.id]); // Removed isReading from dependencies since we use useRef

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavoriteStatus = !isFavorited;
    setIsFavorited(newFavoriteStatus);

    if (newFavoriteStatus) {
      addToFavorites(article.id);
    } else {
      removeFromFavorites(article.id);
    }
  };

  const handleRating = (e: React.MouseEvent, ratingValue: number) => {
    e.stopPropagation();
    setRating(ratingValue);
    rateRecommendation(article.id, ratingValue);
    setShowRating(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (layout === 'horizontal') {
    return (
      <article className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group">
        <div onClick={handleClick} className="md:flex">
          <div className="md:w-1/3">
            <div className="relative">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">
                  {article.category}
                </span>
              </div>
            </div>
          </div>

          <div className="md:w-2/3 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
                {article.title}
              </h3>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={handleFavoriteToggle}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isFavorited
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRating(!showRating);
                    }}
                    className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <Star className="h-4 w-4" />
                  </button>

                  {showRating && (
                    <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex space-x-1 z-10">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={(e) => handleRating(e, star)}
                          className="p-1 hover:scale-110 transition-transform duration-200"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= rating
                                ? 'text-gray-900 dark:text-white fill-current'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {article.summary}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{article.readTime} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{article.source}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">
                    {article.author.charAt(0)}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {article.author}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Vertical layout (for favorites page)
  return (
    <article className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group">
      <div onClick={handleClick}>
        <div className="relative">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">
              {article.category}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex space-x-2">
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
                isFavorited
                  ? 'bg-gray-900/90 text-white'
                  : 'bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
            {article.title}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {article.summary}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} min</span>
              </div>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};