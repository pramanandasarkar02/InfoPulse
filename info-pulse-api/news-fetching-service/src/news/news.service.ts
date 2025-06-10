import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { News } from './news.schema';
import { CreateNewsDto } from './create-news.dto';
import { UpdateNewsDto } from './update-news.dto';

@Injectable()
export class NewsService {
  constructor(@InjectModel(News.name) private newsModel: Model<News>) {}

  async createNews(createNewsDto: CreateNewsDto): Promise<News> {
    const newNews = new this.newsModel({
      ...createNewsDto,
      insertionDate: new Date(),
    });
    return newNews.save();
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
    const updatedNews = await this.newsModel
      .findByIdAndUpdate(id, { $set: updateNewsDto }, { new: true })
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
}