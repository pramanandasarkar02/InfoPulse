import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import axios from 'axios';

interface Article {
  id: string;
  title: string;
  url: string;
  content: string;
  rawHtml: string;
  insertionDate: Date;
  source?: string;
  category?: string;
}

interface NewsSource {
  name: string;
  url: string;
  params: any;
  transform: (data: any) => any[];
}

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private readonly maxRetries = 2;
  private readonly retryDelay = 1000;
  private readonly processedUrls = new Set<string>();
  
  // External news APIs that don't require HTML fetching
  private readonly newsSources: NewsSource[] = [
    // NewsAPI - Multiple categories
    {
      name: 'NewsAPI-General',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'us',
        category: 'general',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    {
      name: 'NewsAPI-Business',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'us',
        category: 'business',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    {
      name: 'NewsAPI-Technology',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'us',
        category: 'technology',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    {
      name: 'NewsAPI-Health',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'us',
        category: 'health',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    {
      name: 'NewsAPI-Science',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'us',
        category: 'science',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    {
      name: 'NewsAPI-Sports',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'us',
        category: 'sports',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    {
      name: 'NewsAPI-Entertainment',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'us',
        category: 'entertainment',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    // International sources
    {
      name: 'NewsAPI-UK',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'gb',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    {
      name: 'NewsAPI-Canada',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'ca',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    {
      name: 'NewsAPI-Australia',
      url: 'https://newsapi.org/v2/top-headlines',
      params: {
        country: 'au',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    // NewsAPI Everything endpoint for more coverage
    {
      name: 'NewsAPI-Everything-Breaking',
      url: 'https://newsapi.org/v2/everything',
      params: {
        q: 'breaking news',
        language: 'en',
        sortBy: 'publishedAt',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    {
      name: 'NewsAPI-Everything-Latest',
      url: 'https://newsapi.org/v2/everything',
      params: {
        q: 'latest news',
        language: 'en',
        sortBy: 'publishedAt',
        apiKey: process.env.NEWS_API_KEY || '44f17ecced324b8e9b8492a08c407eb3',
        pageSize: 100
      },
      transform: (data) => data.articles || []
    },
    // NewsData.io API (Free tier: 200 requests/day)
    {
      name: 'NewsData-Latest',
      url: 'https://newsdata.io/api/1/news',
      params: {
        apikey: process.env.NEWSDATA_API_KEY || 'pub_583079cb9f1c30e932bb79e9d3b59f4a4e96d', // Free public key
        language: 'en',
        size: 50
      },
      transform: (data) => (data.results || []).map((item: any) => ({
        title: item.title,
        description: item.description,
        url: item.link,
        urlToImage: item.image_url,
        publishedAt: item.pubDate,
        content: item.content
      }))
    },
    // GNews API (Free tier: 100 requests/day)
    {
      name: 'GNews-TopHeadlines',
      url: 'https://gnews.io/api/v4/top-headlines',
      params: {
        token: process.env.GNEWS_API_KEY || 'demo_token', // Replace with real token
        lang: 'en',
        max: 50
      },
      transform: (data) => (data.articles || []).map((item: any) => ({
        title: item.title,
        description: item.description,
        url: item.url,
        urlToImage: item.image,
        publishedAt: item.publishedAt,
        content: item.content
      }))
    },
    // Currents API (Free tier: 600 requests/day)
    {
      name: 'Currents-Latest',
      url: 'https://api.currentsapi.services/v1/latest-news',
      params: {
        apiKey: process.env.CURRENTS_API_KEY || 'demo_key', // Replace with real key
        language: 'en',
        page_size: 50
      },
      transform: (data) => (data.news || []).map((item: any) => ({
        title: item.title,
        description: item.description,
        url: item.url,
        urlToImage: item.image,
        publishedAt: item.published,
        content: item.description
      }))
    }
  ];

  async onModuleInit() {
    this.logger.log('News service initialized, starting initial fetch...');
    await this.fetchAllNews();
  }

  @Interval(300000) // 5 minutes
  async handleCron(): Promise<void> {
    this.logger.debug('Scheduled news fetch starting...');
    await this.fetchAllNews();
  }

  private async fetchAllNews(): Promise<void> {
    const allArticles: any[] = [];
    
    // Fetch from all sources with controlled concurrency
    const results = await this.fetchFromSourcesConcurrently(3); // Max 3 concurrent requests
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        this.logger.log(`${this.newsSources[index].name}: ${result.value.length} articles`);
        allArticles.push(...result.value);
      } else if (result.status === 'rejected') {
        this.logger.warn(`${this.newsSources[index].name} failed:`, result.reason);
      }
    });

    // Remove duplicates
    const uniqueArticles = this.removeDuplicates(allArticles);
    this.logger.log(`Total unique articles collected: ${uniqueArticles.length}`);

    // Process articles without fetching HTML (use API content only)
    await this.processArticlesInBatches(uniqueArticles, 10);
  }

  private async fetchFromSourcesConcurrently(concurrency: number): Promise<PromiseSettledResult<any[]>[]> {
    const results: PromiseSettledResult<any[]>[] = [];
    
    for (let i = 0; i < this.newsSources.length; i += concurrency) {
      const batch = this.newsSources.slice(i, i + concurrency);
      const batchPromises = batch.map(source => this.fetchFromSource(source));
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (i + concurrency < this.newsSources.length) {
        await this.delay(1000);
      }
    }
    
    return results;
  }

  private async fetchFromSource(source: NewsSource): Promise<any[]> {
    try {
      const response = await axios.get(source.url, {
        params: source.params,
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'NewsAggregator/1.0'
        }
      });

      const articles = source.transform(response.data);
      return articles.map(article => ({
        ...article,
        source: source.name,
        apiResponse: true // Flag to indicate this came from API
      }));
    } catch (error) {
      this.logger.warn(`Failed to fetch from ${source.name}:`, 
        error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  private removeDuplicates(articles: any[]): any[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      if (!article.url) return false;
      
      // Normalize URL for better duplicate detection
      const normalizedUrl = article.url.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .replace(/\?.*$/, ''); // Remove query parameters
      
      if (seen.has(normalizedUrl)) {
        return false;
      }
      seen.add(normalizedUrl);
      return true;
    });
  }

  private async processArticlesInBatches(articles: any[], batchSize: number): Promise<void> {
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const promises = batch.map(article => this.processArticle(article));
      
      await Promise.allSettled(promises);
      
      // Shorter delay since we're not fetching HTML
      if (i + batchSize < articles.length) {
        await this.delay(200);
      }
    }
  }

  private async processArticle(article: any): Promise<void> {
    try {
      if (this.processedUrls.has(article.url)) {
        return;
      }
      this.processedUrls.add(article.url);
      
      // Clean up processed URLs set if it gets too large
      if (this.processedUrls.size > 5000) {
        this.processedUrls.clear();
      }

      // Use API content instead of fetching HTML
      const articleData: Article = {
        id: this.generateId(),
        title: article.title || 'Untitled Article',
        url: article.url || '',
        content: article.description || article.content || '',
        rawHtml: article.apiResponse ? 'API_CONTENT_ONLY' : '', // Don't fetch HTML for API sources
        insertionDate: new Date(),
        source: article.source || 'Unknown',
        category: this.extractCategory(article.source),
      };

      await this.sendToProcessingServiceWithRetry(articleData);
      
    } catch (error) {
      this.logger.error(`Failed to process article: ${article.title}`, 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private extractCategory(sourceName: string): string {
    if (!sourceName) return 'general';
    
    const lowerSource = sourceName.toLowerCase();
    if (lowerSource.includes('business')) return 'business';
    if (lowerSource.includes('technology') || lowerSource.includes('tech')) return 'technology';
    if (lowerSource.includes('health')) return 'health';
    if (lowerSource.includes('science')) return 'science';
    if (lowerSource.includes('sports')) return 'sports';
    if (lowerSource.includes('entertainment')) return 'entertainment';
    
    return 'general';
  }

  private async sendToProcessingServiceWithRetry(article: Article, retryCount = 0): Promise<void> {
    try {
      const response = await axios.post(
        process.env.PROCESSING_SERVICE_URL || 'http://localhost:4042/articles',
        article,
        {
          timeout: 60000, // Increased to 60 seconds
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.debug(`✓ Sent: ${article.title.substring(0, 50)}...`);
      
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(`Retry ${retryCount + 1}/${this.maxRetries} for: ${article.title.substring(0, 30)}...`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.sendToProcessingServiceWithRetry(article, retryCount + 1);
      }
      
      // Check if it's a specific error we can handle
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          this.logger.error(`Network timeout for: ${article.title.substring(0, 30)}...`);
        } else if (error.response?.status === 413) {
          this.logger.warn(`Payload too large, trying without HTML: ${article.title.substring(0, 30)}...`);
          const lightArticle = { ...article, rawHtml: '' };
          await this.sendLightArticle(lightArticle);
          return;
        } else {
          this.logger.error(`HTTP ${error.response?.status || 'unknown'} for: ${article.title.substring(0, 30)}...`);
        }
      } else {
        this.logger.error(`Failed to send: ${article.title.substring(0, 30)}...`, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private async sendLightArticle(article: Article): Promise<void> {
    try {
      await axios.post(
        process.env.PROCESSING_SERVICE_URL || 'http://localhost:3002/articles',
        article,
        {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      this.logger.debug(`✓ Sent light version: ${article.title.substring(0, 50)}...`);
    } catch (error) {
      this.logger.error(`Failed to send light version: ${article.title.substring(0, 30)}...`);
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}