// src/services/NewsService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

class NewsService {
  // NEWS FETCHING SERVICE METHODS
  constructor() {
    this.cachedArticles = [];
  }

  async getCategories() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/news/categories`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch categories' 
      };
    }
  }

  async getArticles(filters) {
    if (this.cachedArticles.length > 0) {
      return { data: this.cachedArticles };
    }

    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/news/articles?${params.toString()}`
      );
      this.cachedArticles = response.data;
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles' 
      };
    }
  }

  async getArticlesByCategory(category, filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/news/articles/${category}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by category' 
      };
    }
  }

  async createArticle(article) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/articles`,
        article
      );
      return { data: response.data, message: 'Article created successfully' };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to create article' 
      };
    }
  }

  async getNewsStats() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/news/stats`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch news statistics' 
      };
    }
  }

  // NEWS PROCESSING SERVICE METHODS

  async processArticle(articleId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/processing/process-article`,
        { articleId }
      );
      return { data: response.data, message: 'Article processed successfully' };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to process article' 
      };
    }
  }

  async processAllArticles() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/processing/process-all`
      );
      return { data: response.data, message: 'All articles processing started' };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to process all articles' 
      };
    }
  }

  async getProcessedArticles(filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/processing/articles?${params.toString()}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch processed articles' 
      };
    }
  }

  async getProcessedArticlesByCategory(category, filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/processing/articles/category/${category}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by category' 
      };
    }
  }

  async getProcessedArticlesByTag(tag, filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/processing/articles/tag/${tag}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by tag' 
      };
    }
  }

  async getProcessedArticlesByAuthor(author, filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/processing/articles/author/${author}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by author' 
      };
    }
  }

  async getProcessedArticlesByPublication(publication, filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/processing/articles/publication/${publication}?${params.toString()}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch articles by publication' 
      };
    }
  }

  async getArticleById(id) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/articles/${id}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch article' 
      };
    }
  }

  async getArticleByTitle(title) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/articles/title/${title}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch article' 
      };
    }
  }

  async getArticleByLink(url) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${API_BASE_URL}/articles/url`,
        data: { url: url }
      });
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch article' 
      };
    }
  }

  async getProcessingStats() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/processing/stats`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch processing statistics' 
      };
    }
  }

  async checkDuplicate(articleData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/processing/check-duplicate`,
        articleData
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to check for duplicates' 
      };
    }
  }

  async getDuplicates(filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/processing/duplicates?${params.toString()}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch duplicates' 
      };
    }
  }

  async cleanupDuplicates() {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/processing/duplicates/cleanup`
      );
      return { data: response.data, message: 'Duplicates cleaned up successfully' };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to cleanup duplicates' 
      };
    }
  }

  // UTILITY METHODS

  async searchArticles(query, filters) {
    return this.getArticles({ ...filters, search: query });
  }

  async getRecentArticles(days = 7, limit = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.getArticles({
      startDate: startDate.toISOString().split('T')[0],
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });
  }

  async getTrendingArticles(limit = 10) {
    return this.getProcessedArticles({
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
      isProcessed: true
    });
  }

  async getPopularCategories() {
    try {
      const statsResult = await this.getNewsStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch popular categories' };
      }
      
      return { data: statsResult.data.topCategories };
    } catch (error) {
      return { error: 'Failed to fetch popular categories' };
    }
  }

  async getPopularAuthors() {
    try {
      const statsResult = await this.getNewsStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch popular authors' };
      }
      
      return { data: statsResult.data.topAuthors };
    } catch (error) {
      return { error: 'Failed to fetch popular authors' };
    }
  }
  async getRecommendedArticles(userId) {
    try {
        const response = await axios.get(
          `${API_BASE_URL}/recommendations/${userId}`
        )
        return { data: response.data };

    } catch (error) {
      return { error: 'Failed to fetch recommended articles' };
    }
  }


  async getPopularPublications() {
    try {
      const statsResult = await this.getNewsStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch popular publications' };
      }
      
      return { data: statsResult.data.topPublications };
    } catch (error) {
      return { error: 'Failed to fetch popular publications' };
    }
  }

  // Helper method to format date for API
  formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
  }

  // Helper method to build query parameters
  buildQueryParams(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    return params.toString();
  }
  async getStats(){
    try {
      const response = await axios.get(
        `${API_BASE_URL}/stats`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch processing statistics' 
      };
    }
  } 
}



// Create singleton instance
const newsService = new NewsService();

export default newsService;