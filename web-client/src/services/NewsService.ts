// src/services/NewsService.ts
import axios, { AxiosResponse } from 'axios';
import { Interface } from 'readline';

const API_BASE_URL =  'http://localhost:8080';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  author: string;
  publication: string;
  insertion_date: string;
  category: string;
  tags: string[];
  url: string;
  images: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  reading_time?: number ; 
  // wordCount?: number;
  // isProcessed?: boolean;
  // isDuplicate?: boolean;
  // createdAt: string;
  // updatedAt: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  description?: string;
  articleCount: number;
}

export interface NewsStats {
  totalArticles: number;
  totalCategories: number;
  articlesThisWeek: number;
  articlesThisMonth: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  topAuthors: Array<{
    author: string;
    count: number;
  }>;
  topPublications: Array<{
    publication: string;
    count: number;
  }>;
}

export interface ProcessingStats {
  totalProcessed: number;
  totalUnprocessed: number;
  duplicatesFound: number;
  processingRate: number;
  averageProcessingTime: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface DuplicateArticle {
  id: string;
  originalId: string;
  title: string;
  author: string;
  publication: string;
  similarity: number;
  createdAt: string;
}

export interface ArticleFilters {
  category?: string;
  author?: string;
  publication?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  isProcessed?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'publishedAt' | 'createdAt' | 'title' | 'author';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  author: string;
  publication: string;
  category: string;
  tags: string[];
  url: string;
  imageUrl?: string;
  publishedAt?: string;
}


export type ArticleResponse = {
    id: number;
    title: string;
    content: string;
    images: string[];
    publication: string;
    author: string;
    category: string;
    tags: string[];
    url: string;
    reading_time: number;
   
}
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class NewsService {
  // NEWS FETCHING SERVICE METHODS

  async getCategories(): Promise<ApiResponse<NewsCategory[]>> {
    try {
      const response: AxiosResponse<NewsCategory[]> = await axios.get(
        `${API_BASE_URL}/news/categories`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch categories' 
      };
    }
  }

  async getArticles(filters?: ArticleFilters): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<NewsArticle>> = await axios.get(
        `${API_BASE_URL}/news/articles?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles' 
      };
    }
  }

  async getArticlesByCategory(category: string, filters?: Omit<ArticleFilters, 'category'>): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<NewsArticle>> = await axios.get(
        `${API_BASE_URL}/news/articles/${category}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by category' 
      };
    }
  }

  async createArticle(article: CreateArticleRequest): Promise<ApiResponse<NewsArticle>> {
    try {
      const response: AxiosResponse<NewsArticle> = await axios.post(
        `${API_BASE_URL}/news/articles`,
        article
      );
      return { data: response.data, message: 'Article created successfully' };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to create article' 
      };
    }
  }

  async getNewsStats(): Promise<ApiResponse<NewsStats>> {
    try {
      const response: AxiosResponse<NewsStats> = await axios.get(
        `${API_BASE_URL}/news/stats`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch news statistics' 
      };
    }
  }

  // NEWS PROCESSING SERVICE METHODS

  async processArticle(articleId: string): Promise<ApiResponse<{ message: string; processedArticle: NewsArticle }>> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/processing/process-article`,
        { articleId }
      );
      return { data: response.data, message: 'Article processed successfully' };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to process article' 
      };
    }
  }

  async processAllArticles(): Promise<ApiResponse<{ message: string; processedCount: number }>> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/processing/process-all`
      );
      return { data: response.data, message: 'All articles processing started' };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to process all articles' 
      };
    }
  }

  async getProcessedArticles(filters?: ArticleFilters): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<NewsArticle>> = await axios.get(
        `${API_BASE_URL}/processing/articles?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch processed articles' 
      };
    }
  }

  async getProcessedArticlesByCategory(category: string, filters?: Omit<ArticleFilters, 'category'>): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<NewsArticle>> = await axios.get(
        `${API_BASE_URL}/processing/articles/category/${category}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by category' 
      };
    }
  }

  async getProcessedArticlesByTag(tag: string, filters?: Omit<ArticleFilters, 'tag'>): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<NewsArticle>> = await axios.get(
        `${API_BASE_URL}/processing/articles/tag/${tag}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by tag' 
      };
    }
  }

  async getProcessedArticlesByAuthor(author: string, filters?: Omit<ArticleFilters, 'author'>): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<NewsArticle>> = await axios.get(
        `${API_BASE_URL}/processing/articles/author/${author}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by author' 
      };
    }
  }

  async getProcessedArticlesByPublication(publication: string, filters?: Omit<ArticleFilters, 'publication'>): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<NewsArticle>> = await axios.get(
        `${API_BASE_URL}/processing/articles/publication/${publication}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by publication' 
      };
    }
  }

  async getArticleById(id: string): Promise<ApiResponse<NewsArticle>> {
    try {
      const response: AxiosResponse<NewsArticle> = await axios.get(
        `${API_BASE_URL}/articles/${id}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch article' 
      };
    }
  }

  async getArticleByTitle(title: string): Promise<ApiResponse<NewsArticle>> {
    try {
      const response: AxiosResponse<NewsArticle> = await axios.get(
      `${API_BASE_URL}/articles/title/${title}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch article' 
      };
    }
  }

  async getArticleByLink(url: string): Promise<ApiResponse<NewsArticle>> {
      try {
        const response: AxiosResponse<NewsArticle> = await axios({
          method: 'GET',
          url: `${API_BASE_URL}/articles/url`, // Matches server endpoint
          data: { url: url } // Send url in body as expected by server
        });
        return { data: response.data };
      } catch (error: any) {
        return { 
          error: error.response?.data?.error || 'Failed to fetch article' 
        };
      }
  }
    
  

  async getProcessingStats(): Promise<ApiResponse<ProcessingStats>> {
    try {
      const response: AxiosResponse<ProcessingStats> = await axios.get(
        `${API_BASE_URL}/processing/stats`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch processing statistics' 
      };
    }
  }

  async checkDuplicate(articleData: { title: string; content: string; author: string }): Promise<ApiResponse<{ isDuplicate: boolean; similarArticles?: NewsArticle[] }>> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/processing/check-duplicate`,
        articleData
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to check for duplicates' 
      };
    }
  }

  async getDuplicates(filters?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<DuplicateArticle>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null ) {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<DuplicateArticle>> = await axios.get(
        `${API_BASE_URL}/processing/duplicates?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch duplicates' 
      };
    }
  }

  async cleanupDuplicates(): Promise<ApiResponse<{ message: string; cleanedCount: number }>> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/processing/duplicates/cleanup`
      );
      return { data: response.data, message: 'Duplicates cleaned up successfully' };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to cleanup duplicates' 
      };
    }
  }

  // UTILITY METHODS

  async searchArticles(query: string, filters?: Omit<ArticleFilters, 'search'>): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    return this.getArticles({ ...filters, search: query });
  }

  async getRecentArticles(days: number = 7, limit: number = 10): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.getArticles({
      startDate: startDate.toISOString().split('T')[0],
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });
  }

  async getTrendingArticles(limit: number = 10): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    return this.getProcessedArticles({
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
      isProcessed: true
    });
  }

  async getPopularCategories(): Promise<ApiResponse<Array<{ category: string; count: number }>>> {
    try {
      const statsResult = await this.getNewsStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch popular categories' };
      }
      
      return { data: statsResult.data.topCategories };
    } catch (error: any) {
      return { error: 'Failed to fetch popular categories' };
    }
  }

  async getPopularAuthors(): Promise<ApiResponse<Array<{ author: string; count: number }>>> {
    try {
      const statsResult = await this.getNewsStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch popular authors' };
      }
      
      return { data: statsResult.data.topAuthors };
    } catch (error: any) {
      return { error: 'Failed to fetch popular authors' };
    }
  }

  async getPopularPublications(): Promise<ApiResponse<Array<{ publication: string; count: number }>>> {
    try {
      const statsResult = await this.getNewsStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch popular publications' };
      }
      
      return { data: statsResult.data.topPublications };
    } catch (error: any) {
      return { error: 'Failed to fetch popular publications' };
    }
  }

  // Helper method to format date for API
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Helper method to build query parameters
  buildQueryParams(filters: Record<string, any>): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    return params.toString();
  }
}

// Create singleton instance
const newsService = new NewsService();

export default newsService;