import { Module } from '@nestjs/common';
import { RawNewsService } from './raw_news.service';
import { RawNewsController } from './raw_news.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RawNews, RawNewsSchema } from './entities/raw_new.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RawNews.name, schema: RawNewsSchema}])
  ],
  controllers: [RawNewsController],
  providers: [RawNewsService],
})
export class RawNewsModule {}
