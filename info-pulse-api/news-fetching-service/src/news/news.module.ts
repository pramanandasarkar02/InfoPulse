import { Module } from '@nestjs/common';
import { FetchService } from './fetch/fetch.service';
import { SaveService } from './save/save.service';

@Module({
  providers: [FetchService, SaveService]
})
export class NewsModule {}
