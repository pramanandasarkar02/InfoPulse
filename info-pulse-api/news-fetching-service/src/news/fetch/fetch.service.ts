// src/news/fetch.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FetchService {
  private newsData: any[] = [];

  constructor() {
    this.fetchNewsPeriodically();
  }

  private async fetchNews() {
    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          country: 'us',
          apiKey: '44f17ecced324b8e9b8492a08c407eb3',
        },
      });
      this.newsData = response.data.articles;
      console.log(`[FetchService] Fetched ${this.newsData.length} articles`);
    } catch (error) {
      console.error('[FetchService] Failed to fetch news', error);
    }
  }

  private fetchNewsPeriodically() {
    this.fetchNews(); // Immediate fetch
    setInterval(() => this.fetchNews(), 20 * 1000); // Every 10 mins
  }

  getNews() {
    return this.newsData;
  }
}
