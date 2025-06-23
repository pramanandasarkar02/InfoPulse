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

const API_BASE_URL = 'http://localhost:3001';

// Enhanced default images pool for better variety
const DEFAULT_IMAGES = [
  'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/159613/ghsa-regulations-hand-official-159613.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/97050/pexels-photo-97050.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1591061/pexels-photo-1591061.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/261963/pexels-photo-261963.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1591063/pexels-photo-1591063.jpeg?auto=compress&cs=tinysrgb&w=800',
];

// Category-specific images for better visual context
const CATEGORY_IMAGES: { [key: string]: string[] } = {
  'Technology': [
    'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'Business': [
    'https://images.pexels.com/photos/159613/ghsa-regulations-hand-official-159613.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/97050/pexels-photo-97050.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1591061/pexels-photo-1591061.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'Health': [
    'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'Sports': [
    'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'Entertainment': [
    'https://images.pexels.com/photos/1164674/pexels-photo-1164674.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1164674/pexels-photo-1164674.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'Politics': [
    'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1550340/pexels-photo-1550340.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1550344/pexels-photo-1550344.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'Science': [
    'https://images.pexels.com/photos/256262/pexels-photo-256262.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'Environment': [
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1366942/pexels-photo-1366942.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
};

export class NewsApiService {
  private static transformArticle(apiArticle: ApiNewsArticle): NewsArticle {
    // Extract author from content or use a default
    const author = this.extractAuthor(apiArticle.content) || 'News Reporter';
    
    // Calculate read time based on content length (improved calculation)
    const wordsPerMinute = 200;
    const wordCount = apiArticle.content.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    
    // Determine category from topics
    const category = this.determineCategory(apiArticle.topics);
    
    // Get the best available image with enhanced selection
    const imageUrl = this.selectBestImage(apiArticle.images, category);
    
    // Extract source from URL
    const source = this.extractSource(apiArticle.url);

    // Enhanced summary selection - prioritize large summary
    const summary = this.getBestSummary(apiArticle);

    return {
      id: apiArticle._id || apiArticle.id,
      title: apiArticle.title,
      summary,
      content: apiArticle.content,
      author,
      publishedAt: apiArticle.insertionDate,
      imageUrl,
      category,
      tags: [...new Set([...(apiArticle.keywords || []), ...(apiArticle.topics || [])])].slice(0, 5), // Remove duplicates
      source,
      readTime,
      url: apiArticle.url,
      isFavorited: false
    };
  }

  private static getBestSummary(apiArticle: ApiNewsArticle): string {
    // Prioritize summaryLarge, then summarySmall, then generate from content
    if (apiArticle.summaryLarge && apiArticle.summaryLarge.trim().length > 0) {
      return apiArticle.summaryLarge.trim();
    }
    
    if (apiArticle.summarySmall && apiArticle.summarySmall.trim().length > 0) {
      return apiArticle.summarySmall.trim();
    }
    
    // Generate summary from content (first 2-3 sentences)
    const sentences = apiArticle.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2) {
      return sentences.slice(0, 3).join('. ').trim() + '.';
    }
    
    // Fallback to first 200 characters
    return apiArticle.content.substring(0, 200).trim() + '...';
  }

  private static selectBestImage(images: string[], category: string): string {
    // First, try to use images from the API
    if (images && images.length > 0) {
      // Filter out invalid or broken image URLs
      const validImages = images.filter(img => 
        img && 
        typeof img === 'string' && 
        img.trim().length > 0 &&
        (img.startsWith('http://') || img.startsWith('https://'))
      );
      
      if (validImages.length > 0) {
        return validImages[0]; // Use the first valid image
      }
    }
    
    // Fall back to category-specific images
    if (CATEGORY_IMAGES[category] && CATEGORY_IMAGES[category].length > 0) {
      const categoryImages = CATEGORY_IMAGES[category];
      return categoryImages[Math.floor(Math.random() * categoryImages.length)];
    }
    
    // Final fallback to default images
    return DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
  }

  private static extractAuthor(content: string): string | null {
    // Enhanced author extraction patterns
    const authorPatterns = [
      /By\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /Reporter:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /Written by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /Author:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /\-\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:\s*$|\s*\n)/m,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*-|\s*,|\s*\|)/m,
      /Correspondent:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /Staff Writer:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    ];

    for (const pattern of authorPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const author = match[1].trim();
        // Validate author name (should be 2-4 words, each starting with capital)
        if (author.split(' ').length >= 2 && author.split(' ').length <= 4) {
          return author;
        }
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
      'software': 'Technology',
      'hardware': 'Technology',
      'internet': 'Technology',
      'digital': 'Technology',
      'cyber': 'Technology',
      'business': 'Business',
      'finance': 'Business',
      'economy': 'Business',
      'market': 'Business',
      'stock': 'Business',
      'investment': 'Business',
      'startup': 'Business',
      'entrepreneur': 'Business',
      'health': 'Health',
      'medical': 'Health',
      'healthcare': 'Health',
      'medicine': 'Health',
      'hospital': 'Health',
      'doctor': 'Health',
      'patient': 'Health',
      'disease': 'Health',
      'sports': 'Sports',
      'football': 'Sports',
      'basketball': 'Sports',
      'soccer': 'Sports',
      'tennis': 'Sports',
      'baseball': 'Sports',
      'olympics': 'Sports',
      'championship': 'Sports',
      'entertainment': 'Entertainment',
      'celebrity': 'Entertainment',
      'movies': 'Entertainment',
      'music': 'Entertainment',
      'film': 'Entertainment',
      'tv': 'Entertainment',
      'show': 'Entertainment',
      'actor': 'Entertainment',
      'politics': 'Politics',
      'government': 'Politics',
      'election': 'Politics',
      'policy': 'Politics',
      'president': 'Politics',
      'congress': 'Politics',
      'senate': 'Politics',
      'vote': 'Politics',
      'science': 'Science',
      'research': 'Science',
      'study': 'Science',
      'discovery': 'Science',
      'experiment': 'Science',
      'innovation': 'Science',
      'environment': 'Environment',
      'climate': 'Environment',
      'weather': 'Environment',
      'pollution': 'Environment',
      'green': 'Environment',
      'sustainability': 'Environment',
      'education': 'Education',
      'school': 'Education',
      'university': 'Education',
      'student': 'Education',
      'teacher': 'Education',
      'learning': 'Education',
      'accidents': 'World',
      'incident': 'World',
      'emergency': 'World',
      'tourism': 'Travel',
      'travel': 'Travel',
      'vacation': 'Travel',
      'destination': 'Travel',
      'local news': 'Local',
      'community': 'Local',
      'breaking': 'Breaking News',
      'urgent': 'Breaking News',
      'alert': 'Breaking News'
    };

    // Exact matches first
    for (const topic of topics) {
      const normalizedTopic = topic.toLowerCase().trim();
      if (categoryMap[normalizedTopic]) {
        return categoryMap[normalizedTopic];
      }
    }

    // Partial matches
    for (const topic of topics) {
      const normalizedTopic = topic.toLowerCase().trim();
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
      
      // Enhanced source mapping
      const sourceMap: { [key: string]: string } = {
        'aljazeera.com': 'Al Jazeera',
        'bbc.com': 'BBC News',
        'bbc.co.uk': 'BBC News',
        'cnn.com': 'CNN',
        'reuters.com': 'Reuters',
        'ap.org': 'Associated Press',
        'apnews.com': 'Associated Press',
        'nytimes.com': 'The New York Times',
        'washingtonpost.com': 'The Washington Post',
        'theguardian.com': 'The Guardian',
        'guardian.co.uk': 'The Guardian',
        'bloomberg.com': 'Bloomberg',
        'wsj.com': 'The Wall Street Journal',
        'usatoday.com': 'USA Today',
        'cbsnews.com': 'CBS News',
        'abcnews.go.com': 'ABC News',
        'nbcnews.com': 'NBC News',
        'foxnews.com': 'Fox News',
        'npr.org': 'NPR',
        'time.com': 'Time Magazine',
        'newsweek.com': 'Newsweek',
        'forbes.com': 'Forbes',
        'techcrunch.com': 'TechCrunch',
        'engadget.com': 'Engadget',
        'theverge.com': 'The Verge',
        'wired.com': 'Wired',
        'espn.com': 'ESPN',
        'variety.com': 'Variety',
        'hollywoodreporter.com': 'The Hollywood Reporter'
      };
      
      if (sourceMap[cleanHostname]) {
        return sourceMap[cleanHostname];
      }
      
      // Improved hostname formatting
      const parts = cleanHostname.split('.');
      if (parts.length >= 2) {
        return parts[0]
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
      
      return cleanHostname
        .replace(/[-_]/g, ' ')
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

  // New method to get articles by category
  static async getArticlesByCategory(category: string): Promise<NewsArticle[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/articles/category/${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiArticles: ApiNewsArticle[] = await response.json();
      
      return apiArticles.map(article => this.transformArticle(article));
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      return [];
    }
  }

  // New method to get trending articles
  static async getTrendingArticles(limit: number = 10): Promise<NewsArticle[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/articles/trending?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiArticles: ApiNewsArticle[] = await response.json();
      
      return apiArticles.map(article => this.transformArticle(article));
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      return [];
    }
  }
}