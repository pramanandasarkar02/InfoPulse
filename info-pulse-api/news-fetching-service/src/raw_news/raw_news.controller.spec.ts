import { Test, TestingModule } from '@nestjs/testing';
import { RawNewsController } from './raw_news.controller';
import { RawNewsService } from './raw_news.service';

describe('RawNewsController', () => {
  let controller: RawNewsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RawNewsController],
      providers: [RawNewsService],
    }).compile();

    controller = module.get<RawNewsController>(RawNewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
