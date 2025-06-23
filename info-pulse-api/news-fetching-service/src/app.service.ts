import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import axios from 'axios';

interface Article {
  id: string;
  title: string;
  url: string;
  content: string;
  rawHtml: string;
  insertionDate: Date;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  @Interval(10000)
  async handleCron(): Promise<void> {
    this.logger.debug('Fetching news articles...');
    await this.fetchNews();
  }

  private async fetchNews(): Promise<void> {
    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          country: 'us',
          apiKey: '44f17ecced324b8e9b8492a08c407eb3',
        },
      });

      const articles = response.data.articles;
      this.logger.log(`Fetched ${articles.length} articles from NewsAPI`);

      for (const article of articles) {
        try {
          // Fetch raw HTML content
          const rawHtml = await this.fetchRawHtml(article.url);
          
          // Prepare article data
          const articleData: Article = {
            id: this.generateId(),
            title: article.title || 'Untitled Article',
            url: article.url || '',
            content: article.description || '',
            rawHtml: rawHtml,
            insertionDate: new Date(),
          };

          // Send to processing service
          await this.sendToProcessingService(articleData);
          
        } catch (error) {
          this.logger.error(`Failed to process article: ${article.title}`, 
            error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to fetch news from API:', 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async fetchRawHtml(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const html = await response.text();
      
      // Limit HTML size to prevent payload too large errors (max 1MB)
      const maxSize = 1024 * 1024; // 1MB
      if (html.length > maxSize) {
        this.logger.warn(`HTML content too large (${html.length} chars), truncating to ${maxSize} chars`);
        return html.substring(0, maxSize) + '<!-- TRUNCATED -->';
      }
      
      return html;
    } catch (error) {
      this.logger.warn(`Failed to fetch HTML for ${url}:`, 
        error instanceof Error ? error.message : 'Unknown error');
      return '';
    }
  }

  private async sendToProcessingService(article: Article): Promise<void> {
    try {
      // Check payload size before sending
      const payload = JSON.stringify(article);
      const payloadSize = Buffer.byteLength(payload, 'utf8');
      const maxPayloadSize = 10 * 1024 * 1024; // 10MB limit
      
      if (payloadSize > maxPayloadSize) {
        this.logger.warn(`Payload too large (${payloadSize} bytes), truncating HTML content`);
        // Truncate HTML content if payload is too large
        const truncatedHtml = article.rawHtml.substring(0, 500000) + '<!-- TRUNCATED DUE TO SIZE -->';
        article = { ...article, rawHtml: truncatedHtml };
      }

      const response = await fetch('http://localhost:3001/articles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(article), 'utf8').toString()
        },
        body: JSON.stringify(article),
      });

      if (!response.ok) {
        if (response.status === 413) {
          // Still too large, send without HTML
          this.logger.warn(`Payload still too large, sending without HTML content`);
          const articleWithoutHtml = { ...article, rawHtml: '' };
          await this.sendArticleWithoutHtml(articleWithoutHtml);
          return;
        }
        throw new Error(`Failed to send article: ${response.statusText}`);
      }

      this.logger.debug(`Successfully sent article: ${article.title}`);
    } catch (error) {
      this.logger.error(`Error sending article to processing service:`, 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async sendArticleWithoutHtml(article: Article): Promise<void> {
    try {
      const response = await fetch('http://localhost:3001/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      });

      if (!response.ok) {
        throw new Error(`Failed to send article without HTML: ${response.statusText}`);
      }

      this.logger.debug(`Successfully sent article without HTML: ${article.title}`);
    } catch (error) {
      this.logger.error(`Error sending article without HTML:`, 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}