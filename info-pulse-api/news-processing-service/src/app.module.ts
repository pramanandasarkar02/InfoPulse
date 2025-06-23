// app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Article, ArticleSchema } from './article.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://pramanandasarkar02:2002@cluster0.thyef22.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      {
        dbName: 'newsdb',
      },
    ),
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}