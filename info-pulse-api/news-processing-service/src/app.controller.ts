// app.controller.ts
import { Controller, Get, Param, NotFoundException, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { Article } from './article.schema';
import { CreateArticleDto } from './createArticle.dto';
import { RawArticle } from './types/article';

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

  @Post('/articles')
  async createArticle(@Body() createArticleDto: CreateArticleDto): Promise<Article> {
    const article: RawArticle = {
      ...createArticleDto,
      insertionDate: new Date(),
      keywords: [],
      topics: [],
      summaryLarge: '',
      summarySmall: '',
      images: []
    };

    console.log('Before processing:', {
      id: article.id,
      title: article.title,
      contentLength: article.content?.length || 0
    });

    // Process the article with enhanced AI processing
    const processedArticle = await this.appService.processNewArticle(article);
    
    console.log('After processing:', {
      id: processedArticle.id,
      summaryLarge: processedArticle.summaryLarge?.substring(0, 100) + '...',
      summarySmall: processedArticle.summarySmall?.substring(0, 50) + '...',
      keywordsCount: processedArticle.keywords?.length || 0,
      topicsCount: processedArticle.topics?.length || 0,
      imagesCount: processedArticle.images?.length || 0
    });

    // Save the processed article to database (without rawHtml)
    const savedArticle = await this.appService.createArticle(processedArticle);
    return savedArticle;
  }
}
