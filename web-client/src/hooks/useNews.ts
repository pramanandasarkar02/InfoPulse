import { useState, useEffect, useMemo } from 'react';
// import { NewsArticle, SearchFilters, UserPreferences } from '../types';
// import { NewsApiService } from '../services/newsApi';
import { getUserPreferences } from '../utils/localStorage';
import newsService, { NewsArticle } from '../services/NewsService';

export const useNews = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences());
  // const [filters, setFilters] = useState<SearchFilters>({
  //   query: '',
  //   category: '',
  //   sortBy: 'newest',
  //   dateRange: 'all',
  // });

  // Fetch articles on component mount
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedArticles = await newsService.getArticles();
        setArticles(fetchedArticles);
      } catch (err) {
        setError('Failed to load articles. Please try again later.');
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Update preferences and article favorite status
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

  // Get unique categories from articles
  const availableCategories = useMemo(() => {
    const categories = [...new Set(articles.map(article => article.category))];
    return categories.sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Apply search query
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        article =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.toLowerCase().includes(query)) ||
          article.author.toLowerCase().includes(query) ||
          article.source.toLowerCase().includes(query)
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
          const aRelevance = a.tags.filter(tag => 
            preferences.favoriteTopics.some(topic => 
              topic.toLowerCase().includes(tag.toLowerCase()) || 
              tag.toLowerCase().includes(topic.toLowerCase())
            )
          ).length;
          const bRelevance = b.tags.filter(tag => 
            preferences.favoriteTopics.some(topic => 
              topic.toLowerCase().includes(tag.toLowerCase()) || 
              tag.toLowerCase().includes(topic.toLowerCase())
            )
          ).length;
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
      const aScore = a.tags.filter(tag => 
        preferences.favoriteTopics.some(topic => 
          topic.toLowerCase().includes(tag.toLowerCase()) || 
          tag.toLowerCase().includes(topic.toLowerCase())
        )
      ).length;
      const bScore = b.tags.filter(tag => 
        preferences.favoriteTopics.some(topic => 
          topic.toLowerCase().includes(tag.toLowerCase()) || 
          tag.toLowerCase().includes(topic.toLowerCase())
        )
      ).length;
      
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [filteredArticles, preferences.favoriteTopics]);

  const favoriteArticles = useMemo(() => {
    return articles.filter(article => preferences.favoriteArticles.includes(article.id));
  }, [articles, preferences.favoriteArticles]);

  const refreshArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedArticles = await NewsApiService.fetchArticles();
      setArticles(fetchedArticles);
    } catch (err) {
      setError('Failed to refresh articles. Please try again later.');
      console.error('Error refreshing articles:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    articles: personalizedArticles,
    favoriteArticles,
    availableCategories,
    filters,
    setFilters,
    preferences,
    setPreferences,
    loading,
    error,
    refreshArticles,
  };
};