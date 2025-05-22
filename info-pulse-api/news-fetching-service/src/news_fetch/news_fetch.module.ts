import { Module } from '@nestjs/common';
import { NewsFetchController } from './news_fetch.controller';
import { NewsFetchService } from './news_fetch.service';

@Module({
  controllers: [NewsFetchController],
  providers: [NewsFetchService],
})
export class NewsFetchModule {}
