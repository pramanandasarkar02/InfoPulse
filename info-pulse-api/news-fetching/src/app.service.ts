import { Injectable, Logger } from '@nestjs/common';
import { CreateNewsDto } from './news/create-news.dto';
import { News } from './news/news.schema';
import { NewsService } from './news/news.service';
import { UpdateNewsDto } from './news/update-news.dto';
import { Cron, Interval } from '@nestjs/schedule';
import axios from 'axios'; // Import axios

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  // You might want to store the fetched news, but typically, you'd save it to the database
  // private newsData: any[];

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


  @Interval(10000)
  async handleCron() {
    this.logger.debug('Attempting to fetch news articles...');
    await this.fetchNews();
  }

  private async fetchNews() {
    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          country: 'us',
          apiKey: '44f17ecced324b8e9b8492a08c407eb3', 
        },
      });
      const articles = response.data.articles;
      this.logger.log(`[NewsFetcher] Fetched ${articles.length} articles from NewsAPI.`);

      for (const article of articles) {

        const createNewsDto: CreateNewsDto = {
          title: article.title,
          content: article.description,
          url: article.url
        };
        await this.newsService.createNews(createNewsDto);
      }
      this.logger.log(`[NewsFetcher] Successfully saved/updated ${articles.length} news articles.`);

    } catch (error) {
      this.logger.error('[NewsFetcher] Failed to fetch or save news:', error.message);
      if (error.response) {
        this.logger.error(`[NewsFetcher] NewsAPI Error Response Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}