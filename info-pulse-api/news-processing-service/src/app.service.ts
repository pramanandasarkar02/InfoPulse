// app.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Article, ArticleDocument } from './article.schema';
import { RawArticle } from './types/article';
import * as cheerio from 'cheerio';
import axios from 'axios';

interface RateLimitConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  requestsPerMinute: number;
}

@Injectable()
export class AppService {
  private readonly geminiKey = 'AIzaSyDXCaA27v-tNLfCmJ3I9sHgux8Rhd_9K74';
  private readonly genAI = new GoogleGenerativeAI(this.geminiKey);
  private readonly model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  // Rate limiting configuration
  private readonly rateLimitConfig: RateLimitConfig = {
    maxRetries: 3,
    baseDelay: 15000, // 15 seconds base delay
    maxDelay: 60000,  // 1 minute max delay
    requestsPerMinute: 12 // Keep below the 15 limit
  };
  
  // Track API requests for rate limiting
  private requestQueue: Array<{ timestamp: number; resolve: Function; reject: Function }> = [];
  private isProcessingQueue = false;

  constructor(@InjectModel(Article.name) private articleModel: Model<ArticleDocument>) {
    this.startQueueProcessor();
  }

  getHello(): string {
    return 'Hello World!';
  }

  getPing(): string {
    return 'pong';
  }

  // Create new article and save to database
  async createArticle(articleData: RawArticle): Promise<Article> {
    try {
      // Remove rawHtml before saving to reduce database size
      const { rawHtml, ...dataToSave } = articleData;
      const newArticle = new this.articleModel(dataToSave);
      return await newArticle.save();
    } catch (error) {
      console.error('Error creating article:', error);
      throw new InternalServerErrorException('Failed to create article');
    }
  }

  // Enhanced processing with rate limiting and fallback strategies
  async processNewArticle(article: RawArticle): Promise<RawArticle> {
    try {
      console.log('Starting enhanced AI processing...');
      
      // Extract images from URL if available (this doesn't use AI API)
      const images = article.url ? await this.extractImagesFromUrl(article.url) : [];
      
      // Process AI tasks sequentially with rate limiting instead of parallel
      console.log('Processing AI tasks sequentially to avoid rate limits...');
      
      const summaryLarge = await this.generateLargeSummaryWithRetry(article.content);
      await this.delay(1000); // Small delay between requests
      
      const summarySmall = await this.generateSmallSummaryWithRetry(article.content);
      await this.delay(1000);
      
      const keywords = await this.generateKeywordsWithRetry(article.content);
      await this.delay(1000);
      
      const topics = await this.generateTopicsWithRetry(article.content);

      const result = {
        ...article,
        summaryLarge: summaryLarge || this.generateFallbackLargeSummary(article.content),
        summarySmall: summarySmall || this.generateFallbackSmallSummary(article.content),
        keywords: keywords || this.generateFallbackKeywords(article.content),
        topics: topics || this.generateFallbackTopics(article.content),
        images: images || []
      };

      console.log('After processing:', {
        id: result.id,
        summaryLarge: result.summaryLarge ? '...' : 'fallback used',
        summarySmall: result.summarySmall ? '...' : 'fallback used',
        keywordsCount: result.keywords?.length || 0,
        topicsCount: result.topics?.length || 0,
        imagesCount: result.images?.length || 0
      });

      return result;
    } catch (error) {
      console.error('Error processing new article:', error);
      // Return article with fallback processing if AI completely fails
      return {
        ...article,
        summaryLarge: this.generateFallbackLargeSummary(article.content),
        summarySmall: this.generateFallbackSmallSummary(article.content),
        keywords: this.generateFallbackKeywords(article.content),
        topics: this.generateFallbackTopics(article.content),
        images: []
      };
    }
  }

  // Queue-based rate limiting system
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.requestQueue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old requests from tracking
    this.requestQueue = this.requestQueue.filter(req => req.timestamp > oneMinuteAgo);
    
    // Process requests if under rate limit
    if (this.requestQueue.length < this.rateLimitConfig.requestsPerMinute) {
      const request = this.requestQueue.shift();
      if (request) {
        request.resolve();
      }
    }
    
    this.isProcessingQueue = false;
  }

  private async waitForRateLimit(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        timestamp: Date.now(),
        resolve,
        reject
      });
    });
  }

  // Utility method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry wrapper for API calls
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> {
    let lastError: any;
    
    for (let attempt = 0; attempt < this.rateLimitConfig.maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.error(`Error in ${operationName} (attempt ${attempt + 1}):`, error.message);
        
        if (error.status === 429) {
          // Rate limit error - use exponential backoff
          const delay = Math.min(
            this.rateLimitConfig.baseDelay * Math.pow(2, attempt),
            this.rateLimitConfig.maxDelay
          );
          console.log(`Rate limited. Waiting ${delay}ms before retry...`);
          await this.delay(delay);
        } else if (attempt === this.rateLimitConfig.maxRetries - 1) {
          // Last attempt failed with non-rate-limit error
          break;
        } else {
          // Other error - short delay before retry
          await this.delay(2000);
        }
      }
    }
    
    console.error(`All ${this.rateLimitConfig.maxRetries} attempts failed for ${operationName}`);
    return null;
  }

  // Retry-enabled AI generation methods
  private async generateLargeSummaryWithRetry(text: string): Promise<string | null> {
    return this.retryWithBackoff(
      () => this.generateLargeSummary(text),
      'generateLargeSummary'
    );
  }

  private async generateSmallSummaryWithRetry(text: string): Promise<string | null> {
    return this.retryWithBackoff(
      () => this.generateSmallSummary(text),
      'generateSmallSummary'
    );
  }

  private async generateKeywordsWithRetry(text: string): Promise<string[] | null> {
    return this.retryWithBackoff(
      () => this.generateKeywords(text),
      'generateKeywords'
    );
  }

  private async generateTopicsWithRetry(text: string): Promise<string[] | null> {
    return this.retryWithBackoff(
      () => this.generateTopics(text),
      'generateTopics'
    );
  }

  // Original AI generation methods (unchanged)
  private async generateLargeSummary(text: string): Promise<string | null> {
    if (!text || text.trim().length === 0) {
      return null;
    }

    const prompt = `Create a comprehensive summary of the following news article in 3-5 sentences. Include key details, context, and important implications. Make it informative and complete: 

${text}`;
    
    const result = await this.model.generateContent(prompt);
    return result.response.text().trim();
  }

  private async generateSmallSummary(text: string): Promise<string | null> {
    if (!text || text.trim().length === 0) {
      return null;
    }

    const prompt = `Create a very brief summary of the following news article in 1-2 sentences. Focus only on the most essential information: 

${text}`;
    
    const result = await this.model.generateContent(prompt);
    return result.response.text().trim();
  }

  private async generateKeywords(text: string): Promise<string[] | null> {
    if (!text || text.trim().length === 0) {
      return null;
    }

    const prompt = `Extract 5-10 most relevant keywords or key phrases from the following news article. Focus on important names, places, events, and concepts. Return as a comma-separated list: 

${text}`;
    
    const result = await this.model.generateContent(prompt);
    const keywordsText = result.response.text();
    
    return keywordsText
      .split(',')
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)
      .slice(0, 10);
  }

  private async generateTopics(text: string): Promise<string[] | null> {
    if (!text || text.trim().length === 0) {
      return null;
    }

    const prompt = `Identify 3-7 main topics or categories that this news article covers. Think about broader themes, subject areas, and classifications. Examples: Politics, International Relations, Technology, Economy, Health, etc. Return as a comma-separated list: 

${text}`;
    
    const result = await this.model.generateContent(prompt);
    const topicsText = result.response.text();
    
    return topicsText
      .split(',')
      .map((topic) => topic.trim())
      .filter((topic) => topic.length > 0)
      .slice(0, 7);
  }

  // Fallback methods for when AI fails
  private generateFallbackLargeSummary(text: string): string {
    if (!text) return '';
    
    // Simple extractive summary - take first few sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).join('. ').trim() + '.';
  }

  private generateFallbackSmallSummary(text: string): string {
    if (!text) return '';
    
    // Take first sentence or first 150 characters
    const firstSentence = text.split(/[.!?]+/)[0];
    if (firstSentence && firstSentence.length > 0) {
      return firstSentence.trim() + '.';
    }
    return text.substring(0, 150).trim() + '...';
  }

  private generateFallbackKeywords(text: string): string[] {
    if (!text) return [];
    
    // Simple keyword extraction based on word frequency
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);
  }

  private generateFallbackTopics(text: string): string[] {
    const topics: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Simple topic detection based on keywords
    const topicKeywords = {
      'Politics': ['government', 'minister', 'parliament', 'election', 'political', 'policy'],
      'International': ['country', 'international', 'foreign', 'diplomat', 'global'],
      'Economy': ['economic', 'financial', 'market', 'business', 'trade', 'money'],
      'Technology': ['technology', 'digital', 'tech', 'software', 'internet'],
      'Health': ['health', 'medical', 'hospital', 'doctor', 'patient'],
      'Environment': ['environment', 'climate', 'green', 'pollution', 'energy']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics.length > 0 ? topics : ['General News'];
  }

  // Rest of the methods remain unchanged
  async getArticles(): Promise<Article[]> {
    try {
      return await this.articleModel.find().exec();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch articles');
    }
  }

  async getArticleById(id: string): Promise<Article | null> {
    try {
      return await this.articleModel.findById(id).exec();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch article by ID');
    }
  }

  // Extract images from URL (unchanged)
  private async extractImagesFromUrl(url: string): Promise<string[]> {
    try {
      console.log(`Extracting images from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const images: string[] = [];

      const imageSelectors = [
        'img[src]',
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'link[rel="image_src"]'
      ];

      imageSelectors.forEach(selector => {
        $(selector).each((_, element) => {
          let src = '';
          
          if (selector.includes('meta')) {
            src = $(element).attr('content') || '';
          } else if (selector.includes('link')) {
            src = $(element).attr('href') || '';
          } else {
            src = $(element).attr('src') || '';
          }

          if (src) {
            if (src.startsWith('//')) {
              src = 'https:' + src;
            } else if (src.startsWith('/')) {
              const urlObj = new URL(url);
              src = urlObj.origin + src;
            } else if (!src.startsWith('http')) {
              const urlObj = new URL(url);
              src = urlObj.origin + '/' + src;
            }

            if (src.includes('logo') || src.includes('icon') || src.includes('avatar')) {
              return;
            }

            if (!images.includes(src)) {
              images.push(src);
            }
          }
        });
      });

      console.log(`Found ${images.length} images`);
      return images.slice(0, 10);
    } catch (error) {
      console.error('Error extracting images from URL:', error);
      return [];
    }
  }
}