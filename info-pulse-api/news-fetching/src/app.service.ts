import { Injectable } from '@nestjs/common';
import { CreateNewsDto } from './news/create-news.dto';
import { News } from './news/news.schema';
import { NewsService } from './news/news.service';
import { UpdateNewsDto } from './news/update-news.dto';

@Injectable()
export class AppService {
  constructor(private readonly newsService: NewsService){}
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
}
