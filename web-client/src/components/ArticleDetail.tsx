import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, Share2, BookOpen, Clock, Calendar, Star, ExternalLink, Globe } from 'lucide-react';
import { NewsArticle } from '../types';
import { addToFavorites, removeFromFavorites, addToReadingHistory, rateRecommendation } from '../utils/localStorage';

interface ArticleDetailProps {
  article: NewsArticle;
  onBack: () => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack }) => {
  const [isFavorited, setIsFavorited] = useState(article.isFavorited || false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    addToReadingHistory(article.id);
    
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(scrollPercent, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article.id]);

  const handleFavoriteToggle = () => {
    const newFavoriteStatus = !isFavorited;
    setIsFavorited(newFavoriteStatus);
    
    if (newFavoriteStatus) {
      addToFavorites(article.id);
    } else {
      removeFromFavorites(article.id);
    }
  };

  const handleRating = (ratingValue: number) => {
    setRating(ratingValue);
    rateRecommendation(article.id, ratingValue);
    setShowRating(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleReadOriginal = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Reading Progress Bar */}
      <div className="fixed top-16 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 z-40">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header */}
      <div className="sticky top-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 p-4 z-30">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Feed</span>
          </button>

          <div className="flex items-center space-x-2">
            {article.url && (
              <button
                onClick={handleReadOriginal}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 font-medium"
              >
                <Globe className="h-5 w-5" />
                <span>Read Original</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isFavorited
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowRating(!showRating)}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Star className="h-5 w-5" />
              </button>
              
              {showRating && (
                <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 flex space-x-1 z-10">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      className="p-1 hover:scale-110 transition-transform duration-200"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= rating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="p-6 lg:p-8">
        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-semibold">
              {article.category}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {article.source}
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {article.title}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {article.summary}
          </p>

          <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {article.author.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {article.author}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{article.readTime} min read</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-8">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-64 lg:h-96 object-cover rounded-xl shadow-sm"
          />
        </div>

        {/* Article Body */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-6">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Call to Action for Original Article */}
        {article.url && (
          <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Want to read the full story?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Visit the original article for the complete coverage and additional details.
                </p>
              </div>
              <button
                onClick={handleReadOriginal}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-sm"
              >
                <Globe className="h-5 w-5" />
                <span>Read Original</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Article Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Was this article helpful?
              </span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className="p-1 hover:scale-110 transition-transform duration-200"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= rating
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Published by {article.source}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};