import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NewsFetchModule } from './news_fetch/news_fetch.module';
import { NewsModule } from './news/news.module';

@Module({
  imports: [NewsFetchModule, NewsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
