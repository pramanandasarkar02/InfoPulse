import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [ MongooseModule.forRoot(
      'mongodb+srv://pramanandasarkar02:2002@cluster0.thyef22.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      {
        dbName: 'newsdb'
      },
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
