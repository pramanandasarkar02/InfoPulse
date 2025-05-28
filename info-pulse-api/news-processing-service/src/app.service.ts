import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { News } from './schemas/news.schema';
import { ProcessedNews } from './schemas/processed-news.schema';

const key: string = "AIzaSyDXCaA27v-tNLfCmJ3I9sHgux8Rhd_9K74";

@Injectable()
export class AppService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @InjectModel(News.name) private newsModel: Model<News>,
    @InjectModel(ProcessedNews.name) private processedNewsModel: Model<ProcessedNews>,
  ) {
    this.genAI = new GoogleGenerativeAI(key);
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getNews(): Promise<string[]> {
    try {
      const news = await this.newsModel.find().exec();
      return news.map((item) => item.content || item.title);
    } catch (error) {
      console.error("Error fetching news:", error);
      return [];
    }
  }

  async keywordExtraction(news: string): Promise<string[]> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Extract the top 5 keywords from the following text: ${news}`;

    try {
      const result = await model.generateContent(prompt);
      const keywordsText = result.response.candidates[0].content.parts[0].text;
      const keywords = keywordsText.split(',').map(keyword => keyword.trim()).slice(0, 5);
      return keywords;
    } catch (error) {
      console.error("Error extracting keywords:", error);
      return [];
    }
  }

  async sentimentAnalysis(news: string): Promise<string[]> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Analyze the sentiment of the following text and return the sentiment (positive, negative, or neutral) with a brief explanation: ${news}`;

    try {
      const result = await model.generateContent(prompt);
      const sentimentText = result.response.candidates[0].content.parts[0].text;
      const [sentiment, ...explanation] = sentimentText.split(':').map(part => part.trim());
      return [sentiment, explanation.join(': ')];
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      return [];
    }
  }

  async summarization(news: string): Promise<string | null> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Please summarize the following text: ${news}`;

    try {
      const result = await model.generateContent(prompt);
      const summary = result.response.candidates[0].content.parts[0].text;
      return summary;
    } catch (error) {
      console.error("Error generating summary:", error);
      return null;
    }
  }

  async processNews(): Promise<void> {
    try {
      // Fetch all unprocessed news (no corresponding ProcessedNews entry)
      const newsItems = await this.newsModel.find({
        _id: { $nin: await this.processedNewsModel.distinct('newsId') },
      }).exec();

      for (const news of newsItems) {
        const content = news.content || news.title;
        if (!content) continue;

        // Perform summarization and keyword extraction
        const [summary, keywords] = await Promise.all([
          this.summarization(content),
          this.keywordExtraction(content),
        ]);

        if (summary && keywords.length > 0) {
          // Save to ProcessedNews collection
          await this.processedNewsModel.create({
            newsId: news._id.toString(),
            summary,
            keywords,
          });
        }
      }
    } catch (error) {
      console.error("Error processing news:", error);
    }
  }
}