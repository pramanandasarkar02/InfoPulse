import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NewsFetchModule } from './news_fetch/news_fetch.module';
import { NewsModule } from './news/news.module';
import { RawNewsModule } from './raw_news/raw_news.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://pramanandasarkar02:2002@cluster0.thyef22.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'),
    NewsFetchModule, NewsModule, RawNewsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
