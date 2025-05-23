// src/news/save.service.ts
import { Injectable } from '@nestjs/common';
import { FetchService } from '../fetch/fetch.service';
import * as fs from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { RawNews } from 'src/raw_news/entities/raw_new.entity';

@Injectable()
export class SaveService {
  constructor(private fetchService: FetchService,
    @InjectModel(RawNews)
  ) {
    this.saveNewsPeriodically();
  }

  private saveNewsPeriodically() {
    setInterval(() => {
      const news = this.fetchService.getNews();
      if (news.length > 0) {
        console.log('[SaveService] Saving news...');
        this.saveNewsToFile(news);
      } else {
        console.log('[SaveService] No news available yet.');
      }
    }, 10 * 1000); // Every 10 seconds
  }

  private saveNewsToFile(news: any[]) {
    fs.writeFileSync('news.json', JSON.stringify(news, null, 2), 'utf-8');
    console.log('[SaveService] News saved to news.json');
  }

  private async saveNewsToDatabase(newsItems: any[]){
    try {
      // Transform and save each news item
      const savedItems = await Promise.all(
        newsItems.map(async (news) => {
          const newsData = {
            source: news.source,
            author: news.author,
            title: news.title,
            description: news.description,
            url: news.url,
            urlToImage: news.urlToImage,
            publishedAt: new Date(news.publishedAt),
            content: news.content,
          };
          
          // // Create or update existing news
          const existing = await 
          // const existing = await this.rawNewsModel.findOne({ url: news.url });
          // if (existing) {
          //   return this.rawNewsModel.findByIdAndUpdate(existing._id, newsData, { new: true });
          // }
          return this.
        })
      );
      
      console.log(`[SaveService] Saved ${savedItems.length} news items to database`);
      return savedItems;
    } catch (error) {
      console.error('[SaveService] Error saving to database:', error);
      throw error;
    }
  }

}
