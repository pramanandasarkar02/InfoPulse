import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return 'News Fetcher Service is running';
  }

  @Get('status')
  getStatus(): object {
    return {
      service: 'News Fetcher',
      status: 'active',
      description: 'Fetches news from NewsAPI and forwards to processing service'
    };
  }
}