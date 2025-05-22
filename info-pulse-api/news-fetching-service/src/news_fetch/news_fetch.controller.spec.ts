import { Test, TestingModule } from '@nestjs/testing';
import { NewsFetchController } from './news_fetch.controller';

describe('NewsFetchController', () => {
  let controller: NewsFetchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsFetchController],
    }).compile();

    controller = module.get<NewsFetchController>(NewsFetchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
