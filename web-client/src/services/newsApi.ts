// import { NewsArticle } from '../types';

// Interface for backend Article model
interface ApiNewsArticle {
  _id?: string;
  id: string;
  title: string;
  content: string;
  url: string;
  source?: string;
  insertionDate: string;
  summarySmall: string;
  keywords: string[];
  topics: string[];
  images?: string[];
  __v?: number;
}

// Interface for backend Category model
interface ApiCategory {
  id: number;
  name: string;
}

// Interface for backend RecommendationResponse
interface ApiRecommendationResponse {
  user_id: string;
  recommended_articles: ApiNewsArticle[];
}

// Frontend NewsArticle type (assumed to be in ../types)
interface NewsArticle {
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
  url: string;
  isFavorited: boolean;
}

// Frontend Category type
interface Category {
  id: number;
  name: string;
}

const API_BASE_URL = 'http://localhost:3002';
const CATEGORY_API_URL = 'http://localhost:3003/api/user/categories';
const RECOMMENDATION_API_URL = 'http://localhost:3005/recommendations';

export class NewsApiService {
  private static transformArticle(apiArticle: ApiNewsArticle): NewsArticle {
    // Extract author from content or use a default
    const author = this.extractAuthor(apiArticle.content) || 'News Reporter';

    // Calculate read time based on content length
    const readTime = Math.max(1, Math.ceil(apiArticle.content.length / 1000));

    // Determine category from topics
    const category = this.determineCategory(apiArticle.topics);

    // Get the best available image
    const imageUrl =
      apiArticle.images && apiArticle.images.length > 0
        ? apiArticle.images[0]
        : 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=800';

    // Extract source from URL or use provided source
    const source = apiArticle.source || this.extractSource(apiArticle.url);

    return {
      id: apiArticle._id || apiArticle.id,
      title: apiArticle.title,
      summary: apiArticle.summarySmall || apiArticle.content.substring(0, 200) + '...',
      content: apiArticle.content,
      author,
      publishedAt: apiArticle.insertionDate,
      imageUrl,
      category,
      tags: [...(apiArticle.keywords || []), ...(apiArticle.topics || [])].slice(0, 5),
      source,
      readTime,
      url: apiArticle.url,
      isFavorited: false,
    };
  }

  private static extractAuthor(content: string): string | null {
    const authorPatterns = [
      /By\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /Reporter:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /Written by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /Author:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /\-\s*([A-Z][a-z]+\s+[A-Z][a-z]+)$/m,
    ];

    for (const pattern of authorPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private static determineCategory(topics: string[]): string {
    if (!topics || topics.length === 0) return 'World';

    const categoryMap: { [key: string]: string } = {
      technology: 'Technology',
      tech: 'Technology',
      ai: 'Technology',
      'artificial intelligence': 'Technology',
      business: 'Business',
      finance: 'Business',
      economy: 'Business',
      market: 'Business',
      health: 'Health',
      medical: 'Health',
      healthcare: 'Health',
      medicine: 'Health',
      sports: 'Sports',
      football: 'Sports',
      basketball: 'Sports',
      entertainment: 'Entertainment',
      celebrity: 'Entertainment',
      movies: 'Entertainment',
      music: 'Entertainment',
      politics: 'Politics',
      government: 'Politics',
      election: 'Politics',
      policy: 'Politics',
      science: 'Science',
      research: 'Science',
      study: 'Science',
      environment: 'Environment',
      climate: 'Environment',
      weather: 'Environment',
      education: 'Education',
      school: 'Education',
      university: 'Education',
      accidents: 'World',
      tourism: 'Travel',
      travel: 'Travel',
      'local news': 'Local',
      breaking: 'Breaking News',
    };

    for (const topic of topics) {
      const normalizedTopic = topic.toLowerCase();
      if (categoryMap[normalizedTopic]) {
        return categoryMap[normalizedTopic];
      }
    }

    for (const topic of topics) {
      const normalizedTopic = topic.toLowerCase();
      for (const [key, category] of Object.entries(categoryMap)) {
        if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
          return category;
        }
      }
    }

    return 'World';
  }

  private static extractSource(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const cleanHostname = hostname.replace(/^www\./, '');

      const sourceMap: { [key: string]: string } = {
        'aljazeera.com': 'Al Jazeera',
        'bbc.com': 'BBC News',
        'cnn.com': 'CNN',
        'reuters.com': 'Reuters',
        'ap.org': 'Associated Press',
        'nytimes.com': 'The New York Times',
        'washingtonpost.com': 'The Washington Post',
        'theguardian.com': 'The Guardian',
        'bloomberg.com': 'Bloomberg',
        'wsj.com': 'The Wall Street Journal',
      };

      if (sourceMap[cleanHostname]) {
        return sourceMap[cleanHostname];
      }

      return cleanHostname
        .split('.')
        .slice(0, -1)
        .join(' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
    } catch {
      return 'News Source';
    }
  }

  static async fetchArticles(): Promise<NewsArticle[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/articles`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiArticles: ApiNewsArticle[] = await response.json();
      return apiArticles.map((article) => this.transformArticle(article));
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  }

  static async searchArticles(query: string): Promise<NewsArticle[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/articles/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiArticles: ApiNewsArticle[] = await response.json();
      return apiArticles.map((article) => this.transformArticle(article));
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  }

  static async getArticleById(id: string): Promise<NewsArticle | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/articles/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiArticle: ApiNewsArticle = await response.json();
      return this.transformArticle(apiArticle);
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  }

  static async fetchCategories(userId: string): Promise<Category[]> {
    try {
      const response = await fetch(`${CATEGORY_API_URL}/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const categories: ApiCategory[] = data.categories || [];
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  static async fetchRecommendations(userId: string): Promise<NewsArticle[]> {
    try {
      const response = await fetch(`${RECOMMENDATION_API_URL}/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiRecommendationResponse = await response.json();
      return data.recommended_articles.map((article) => this.transformArticle(article));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  static async saveArticle(userId: string, articleId: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3005/api/user/saved-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, article_id: articleId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error('Error saving article:', error);
      return false;
    }
  }
}