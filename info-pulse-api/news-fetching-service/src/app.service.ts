import { Injectable, Logger } from '@nestjs/common';
import { CreateNewsDto } from './news/create-news.dto';
import { News } from './news/news.schema';
import { NewsService } from './news/news.service';
import { UpdateNewsDto } from './news/update-news.dto';
import { Interval } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio'; // Added missing cheerio import

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly newsService: NewsService) {}

  getHello(): string {
    return 'Hello World!';
  }

  // Create a news article
  async createNews(createNewsDto: CreateNewsDto): Promise<News> {
    return this.newsService.createNews(createNewsDto);
  }

  // Get all news articles
  async getAllNews(): Promise<News[]> {
    return this.newsService.findAll();
  }

  // Get a single news article by ID
  async getNewsById(id: string): Promise<News> {
    return this.newsService.findOne(id);
  }

  // Update a news article by ID
  async updateNews(id: string, updateNewsDto: UpdateNewsDto): Promise<News> {
    return this.newsService.updateNews(id, updateNewsDto);
  }

  // Delete a news article by ID
  async deleteNews(id: string): Promise<void> {
    return this.newsService.deleteNews(id);
  }

  // Fixed method with proper typing and error handling
  async extractNewsContent(url: string): Promise<string> {
    try {
      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Log response for debugging
      console.log('Response Status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Get the HTML content
      const html = await response.text();
      
      // Load HTML into cheerio
      const $ = cheerio.load(html);
      
      // Common selectors for article content, prioritized for AP News
      const articleSelectors = [
        'div.Article', // Common for AP News
        'div[itemprop="articleBody"]',
        'article',
        '.article-body',
        '.entry-content',
        '.post-content',
        '.content'
      ];
      
      let content = '';
      
      // Try each selector until content is found
      for (const selector of articleSelectors) {
        const article = $(selector).text().trim();
        if (article) {
          content = article;
          break;
        }
      }
      
      // Fallback: extract from paragraph tags, excluding noise
      if (!content) {
        content = $('p')
          .not('.caption, .advertisement, .meta, .footer, .sidebar')
          .map((i, el) => $(el).text().trim())
          .get()
          .filter(text => text.length > 20)
          .join('\n\n');
      }
      
      // Clean up excessive whitespace
      content = content.replace(/\s+/g, ' ').trim();
      
      if (!content) {
        return 'No article content found. The website may use a non-standard structure or block scraping.';
      }
      
      return content;
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      return 'Failed to fetch or parse the content. Possible issues: CORS, paywall, or invalid URL.';
    }
  }

  @Interval(10000)
  async handleCron(): Promise<void> {
    this.logger.debug('Attempting to fetch news articles...');
    await this.fetchNews();
  }

  private async fetchNews(): Promise<void> {
    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          country: 'us',
          apiKey: '44f17ecced324b8e9b8492a08c407eb3', 
        },
      });

      const articles = response.data.articles;
      this.logger.log(`[NewsFetcher] Fetched ${articles.length} articles from NewsAPI.`);

      let newArticlesCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;

      for (const article of articles) {
        try {
          const content = await this.extractNewsContent(article.url);

          const createNewsDto: CreateNewsDto = {
            title: article.title,
            content: content,
            url: article.url
          };
          
          await this.newsService.createNews(createNewsDto);
          newArticlesCount++;
          this.logger.debug(`[NewsFetcher] Successfully saved new article: ${article.title}`);
          
        } catch (articleError) {
          // Check if it's a duplicate key error
          if (articleError instanceof Error && articleError.message.includes('E11000 duplicate key error')) {
            duplicateCount++;
            this.logger.debug(`[NewsFetcher] Duplicate article skipped: ${article.title}`);
          } else {
            errorCount++;
            this.logger.error(`[NewsFetcher] Failed to process article: ${article.title}`, articleError instanceof Error ? articleError.message : 'Unknown error');
          }
        }
      }
      
      this.logger.log(`[NewsFetcher] Processing complete - New: ${newArticlesCount}, Duplicates: ${duplicateCount}, Errors: ${errorCount}, Total fetched: ${articles.length}`);

    } catch (error) {
      this.logger.error('[NewsFetcher] Failed to fetch or save news:', error instanceof Error ? error.message : 'Unknown error');
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(`[NewsFetcher] NewsAPI Error Response Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}