import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsModule } from './news/news.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ MongooseModule.forRoot(
      'mongodb+srv://pramanandasarkar02:2002@cluster0.thyef22.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      {
        dbName: 'newsdb'
      },
    ), NewsModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
