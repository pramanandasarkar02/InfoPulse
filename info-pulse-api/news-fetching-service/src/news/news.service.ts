// news/news.service.ts (Alternative with exceptions)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNewsDto } from './create-news.dto';
import { UpdateNewsDto } from './update-news.dto';
import { News, NewsDocument } from './news.schema';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News.name) private newsModel: Model<NewsDocument>,
  ) {}

  async createNews(createNewsDto: CreateNewsDto): Promise<News> {
    const newsData = {
      title: createNewsDto.title,
      url: createNewsDto.url,
      summery: createNewsDto.summary || 'No summary available', // Ensure it's never empty
      content: createNewsDto.content,
      images: createNewsDto.images || [],
      keywords: createNewsDto.keywords || [],
      insertionDate: new Date(),
    };

    const createdNews = new this.newsModel(newsData);
    return createdNews.save();
  }

  async findAll(): Promise<News[]> {
    return this.newsModel.find().exec();
  }

  async findOne(id: string): Promise<News> {
    const news = await this.newsModel.findById(id).exec();
    if (!news) {
      throw new NotFoundException(`News article with ID ${id} not found`);
    }
    return news;
  }

  async updateNews(id: string, updateNewsDto: UpdateNewsDto): Promise<News> {
    const updateData: any = { ...updateNewsDto };
    
    // Map 'summary' to 'summery' if provided
    if (updateNewsDto.summary) {
      updateData.summery = updateNewsDto.summary;
      delete updateData.summary;
    }

    const updatedNews = await this.newsModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!updatedNews) {
      throw new NotFoundException(`News article with ID ${id} not found`);
    }
    
    return updatedNews;
  }

  async deleteNews(id: string): Promise<void> {
    const result = await this.newsModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`News article with ID ${id} not found`);
    }
  }

  // Additional utility methods
  async findByUrl(url: string): Promise<News | null> {
    return this.newsModel.findOne({ url }).exec();
  }

  async findByKeywords(keywords: string[]): Promise<News[]> {
    return this.newsModel
      .find({ keywords: { $in: keywords } })
      .exec();
  }

  async getLatestNews(limit: number = 10): Promise<News[]> {
    return this.newsModel
      .find()
      .sort({ insertionDate: -1 })
      .limit(limit)
      .exec();
  }
}