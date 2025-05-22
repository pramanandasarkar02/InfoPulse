// src/news/save.service.ts
import { Injectable } from '@nestjs/common';
import { FetchService } from '../fetch/fetch.service';
import * as fs from 'fs';

@Injectable()
export class SaveService {
  constructor(private fetchService: FetchService) {
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
}
