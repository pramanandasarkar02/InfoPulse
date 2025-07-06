export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  publishedAt: string;
  imageUrl: string;
  category: string;
  tags: string[];
  source: string;
  readTime: number;
  url?: string;
  isFavorited?: boolean;
}

export interface UserPreferences {
  favoriteTopics: string[];
  readingHistory: string[];
  favoriteArticles: string[];
  recommendationRatings: { [key: string]: number };
}

export interface SearchFilters {
  query: string;
  category: string;
  sortBy: 'newest' | 'oldest' | 'relevance';
  dateRange: 'today' | 'week' | 'month' | 'all';
}

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type CurrentPage = 'feed' | 'explore' | 'favorites' | 'settings' | 'article' | 'admin' | 'upload';