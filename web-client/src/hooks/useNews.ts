import { useState, useEffect, useMemo } from 'react';
import { NewsArticle, SearchFilters, UserPreferences } from '../types';
import { mockNews } from '../data/mockNews';
import { getUserPreferences } from '../utils/localStorage';

export const useNews = () => {
  const [articles, setArticles] = useState<NewsArticle[]>(mockNews);
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences());
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    sortBy: 'newest',
    dateRange: 'all',
  });

  useEffect(() => {
    const updatedPreferences = getUserPreferences();
    setPreferences(updatedPreferences);
    
    // Update articles with favorite status
    setArticles(prevArticles =>
      prevArticles.map(article => ({
        ...article,
        isFavorited: updatedPreferences.favoriteArticles.includes(article.id),
      }))
    );
  }, []);

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Apply search query
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        article =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.toLowerCase().includes(query)) ||
          article.author.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.category && filters.category !== '') {
      filtered = filtered.filter(article => article.category === filters.category);
    }

    // Apply date range filter
    const now = new Date();
    if (filters.dateRange !== 'all') {
      const dateThreshold = new Date();
      switch (filters.dateRange) {
        case 'today':
          dateThreshold.setDate(now.getDate() - 1);
          break;
        case 'week':
          dateThreshold.setDate(now.getDate() - 7);
          break;
        case 'month':
          dateThreshold.setMonth(now.getMonth() - 1);
          break;
      }
      filtered = filtered.filter(article => new Date(article.publishedAt) >= dateThreshold);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'oldest':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'relevance':
          // Simple relevance based on user preferences
          const aRelevance = a.tags.filter(tag => preferences.favoriteTopics.includes(tag)).length;
          const bRelevance = b.tags.filter(tag => preferences.favoriteTopics.includes(tag)).length;
          return bRelevance - aRelevance;
        default:
          return 0;
      }
    });

    return filtered;
  }, [articles, filters, preferences]);

  const personalizedArticles = useMemo(() => {
    if (preferences.favoriteTopics.length === 0) {
      return filteredArticles;
    }

    return filteredArticles.sort((a, b) => {
      const aScore = a.tags.filter(tag => preferences.favoriteTopics.includes(tag)).length;
      const bScore = b.tags.filter(tag => preferences.favoriteTopics.includes(tag)).length;
      
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [filteredArticles, preferences.favoriteTopics]);

  const favoriteArticles = useMemo(() => {
    return articles.filter(article => preferences.favoriteArticles.includes(article.id));
  }, [articles, preferences.favoriteArticles]);

  return {
    articles: personalizedArticles,
    favoriteArticles,
    filters,
    setFilters,
    preferences,
    setPreferences,
  };
};