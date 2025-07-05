import { NewsArticle } from '../types';

interface ApiNewsArticle {
  _id: string;
  id: string;
  title: string;
  content: string;
  url: string;
  insertionDate: string;
  summaryLarge: string;
  summarySmall: string;
  keywords: string[];
  topics: string[];
  images: string[];
  __v: number;
}

const API_BASE_URL = 'http://localhost:3002';

export class NewsApiService {
  private static transformArticle(apiArticle: ApiNewsArticle): NewsArticle {
    // Extract author from content or use a default
    const author = this.extractAuthor(apiArticle.content) || 'News Reporter';
    
    // Calculate read time based on content length
    const readTime = Math.max(1, Math.ceil(apiArticle.content.length / 1000));
    
    // Determine category from topics
    const category = this.determineCategory(apiArticle.topics);
    
    // Get the best available image
    const imageUrl = apiArticle.images && apiArticle.images.length > 0 
      ? apiArticle.images[0] 
      : 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=800';
    
    // Extract source from URL
    const source = this.extractSource(apiArticle.url);

    return {
      id: apiArticle._id || apiArticle.id,
      title: apiArticle.title,
      summary: apiArticle.summaryLarge || apiArticle.content.substring(0, 200) + '...',
      content: apiArticle.content,
      author,
      publishedAt: apiArticle.insertionDate,
      imageUrl,
      category,
      tags: [...(apiArticle.keywords || []), ...(apiArticle.topics || [])].slice(0, 5),
      source,
      readTime,
      url: apiArticle.url, // Include the original URL
      isFavorited: false
    };
  }

  private static extractAuthor(content: string): string | null {
    // Try to extract author from common patterns in news content
    const authorPatterns = [
      /By\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /Reporter:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /Written by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /Author:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /\-\s*([A-Z][a-z]+\s+[A-Z][a-z]+)$/m
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
      'technology': 'Technology',
      'tech': 'Technology',
      'ai': 'Technology',
      'artificial intelligence': 'Technology',
      'business': 'Business',
      'finance': 'Business',
      'economy': 'Business',
      'market': 'Business',
      'health': 'Health',
      'medical': 'Health',
      'healthcare': 'Health',
      'medicine': 'Health',
      'sports': 'Sports',
      'football': 'Sports',
      'basketball': 'Sports',
      'entertainment': 'Entertainment',
      'celebrity': 'Entertainment',
      'movies': 'Entertainment',
      'music': 'Entertainment',
      'politics': 'Politics',
      'government': 'Politics',
      'election': 'Politics',
      'policy': 'Politics',
      'science': 'Science',
      'research': 'Science',
      'study': 'Science',
      'environment': 'Environment',
      'climate': 'Environment',
      'weather': 'Environment',
      'education': 'Education',
      'school': 'Education',
      'university': 'Education',
      'accidents': 'World',
      'tourism': 'Travel',
      'travel': 'Travel',
      'local news': 'Local',
      'breaking': 'Breaking News'
    };

    for (const topic of topics) {
      const normalizedTopic = topic.toLowerCase();
      if (categoryMap[normalizedTopic]) {
        return categoryMap[normalizedTopic];
      }
    }

    // Check for partial matches
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
      
      // Clean up common prefixes
      const cleanHostname = hostname.replace(/^www\./, '');
      
      // Handle common news sources
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
        'wsj.com': 'The Wall Street Journal'
      };
      
      if (sourceMap[cleanHostname]) {
        return sourceMap[cleanHostname];
      }
      
      // Capitalize first letter and clean up
      return cleanHostname
        .split('.')
        .slice(0, -1)
        .join(' ')
        .replace(/\b\w/g, l => l.toUpperCase());
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
      
      return apiArticles.map(article => this.transformArticle(article));
    } catch (error) {
      console.error('Error fetching articles:', error);
      
      // Return empty array on error - the app will show "No articles found"
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
      
      return apiArticles.map(article => this.transformArticle(article));
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
}