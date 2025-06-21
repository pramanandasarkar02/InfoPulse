import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { Article } from './article.schema';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/ping')
  getPing(): string {
    return this.appService.getPing();
  }

  @Get('/articles')
  async getArticles(): Promise<Article[]> {
    return this.appService.getArticles();
  }

  @Get('/articles/:id')
  async getArticleById(@Param('id') id: string): Promise<Article> {
    const article = await this.appService.getArticleById(id);
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    return article;
  }
}