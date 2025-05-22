import { Test, TestingModule } from '@nestjs/testing';
import { NewsFetchService } from './news_fetch.service';

describe('NewsFetchService', () => {
  let service: NewsFetchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewsFetchService],
    }).compile();

    service = module.get<NewsFetchService>(NewsFetchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
