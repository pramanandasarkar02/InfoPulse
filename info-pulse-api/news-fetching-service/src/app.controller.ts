import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateNewsDto } from './news/create-news.dto';
import { News } from './news/news.schema';
import { UpdateNewsDto } from './news/update-news.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("ping")
  getPing(): string {
    return "pong";
  }

  @Post('news')
  async createNews(@Body() createNewsDto: CreateNewsDto): Promise<News> {
    return this.appService.createNews(createNewsDto);
  }

  @Get('news')
  async getAllNews(): Promise<News[]> {
    return this.appService.getAllNews();
  }

  @Get('news/:id')
  async getNewsById(@Param('id') id: string): Promise<News> {
    return this.appService.getNewsById(id);
  }

  @Put('news/:id')
  async updateNews(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto): Promise<News> {
    return this.appService.updateNews(id, updateNewsDto);
  }

  @Delete('news/:id')
  async deleteNews(@Param('id') id: string): Promise<void> {
    return this.appService.deleteNews(id);
  }
}
