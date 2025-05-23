import { Test, TestingModule } from '@nestjs/testing';
import { RawNewsService } from './raw_news.service';

describe('RawNewsService', () => {
  let service: RawNewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RawNewsService],
    }).compile();

    service = module.get<RawNewsService>(RawNewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
