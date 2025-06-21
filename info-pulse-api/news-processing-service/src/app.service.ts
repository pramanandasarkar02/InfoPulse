import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Article, ArticleDocument } from './article.schema';

@Injectable()
export class AppService {
  private readonly geminiKey = 'AIzaSyDXCaA27v-tNLfCmJ3I9sHgux8Rhd_9K74';
  private readonly genAI = new GoogleGenerativeAI(this.geminiKey);
  private readonly model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  constructor(@InjectModel(Article.name) private articleModel: Model<ArticleDocument>) {}

  getHello(): string {
    return 'Hello World!';
  }

  getPing(): string {
    return 'pong';
  }

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

  async processArticles(): Promise<Article[]> {
    try {
      const articles = await this.articleModel.find().exec();
      console.log(articles);
      const updatedArticles: Article[] = [];

      for (const article of articles) {
        if (!article.summary || !article.keywords?.length) {
          const summary = await this.summarizeText(article.content);
          const keywords = await this.generateKeywords(article.content);

          if (summary && keywords) {
            article.summary = summary;
            article.keywords = keywords;
            await article.save();
            updatedArticles.push(article);
          }
        } else {
          updatedArticles.push(article);
        }
      }

      return updatedArticles;
    } catch (error) {
      throw new InternalServerErrorException('Failed to process articles');
    }
  }

  private async summarizeText(text: string): Promise<string | null> {
    const prompt = `Summarize the following text in 2-3 sentences: ${text}`;
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }

  private async generateKeywords(text: string): Promise<string[] | null> {
    const prompt = `Extract 5-10 key words or phrases from the following text: ${text}`;
    try {
      const result = await this.model.generateContent(prompt);
      const keywordsText = result.response.text();
      return keywordsText
        .split(',')
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0)
        .slice(0, 10);
    } catch (error) {
      console.error('Error generating keywords:', error);
      return null;
    }
  }
}