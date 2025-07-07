
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Article } from './article.schema';
import { CreateArticleDto } from './createArticle.dto';
import { NotFoundException } from '@nestjs/common';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  // Mock AppService
  const mockAppService = {
    getHello: jest.fn(),
    getPing: jest.fn(),
    getArticles: jest.fn(),
    getArticleById: jest.fn(),
    processNewArticle: jest.fn(),
    createArticle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      mockAppService.getHello.mockReturnValue('Hello World!');
      expect(appController.getHello()).toBe('Hello World!');
      expect(mockAppService.getHello).toHaveBeenCalled();
    });
  });

  describe('getPing', () => {
    it('should return ping response', () => {
      mockAppService.getPing.mockReturnValue('pong');
      expect(appController.getPing()).toBe('pong');
      expect(mockAppService.getPing).toHaveBeenCalled();
    });
  });

  describe('getArticles', () => {
    it('should return an array of articles', async () => {
      const mockArticles: Article[] = [
        {
          id: '1',
          title: 'Test Article',
          content: 'Test content',
          insertionDate: new Date(),
          keywords: [],
          topics: [],
          summaryLarge: '',
          summarySmall: '',
          images: [],
        },
      ];
      mockAppService.getArticles.mockResolvedValue(mockArticles);
      
      const result = await appController.getArticles();
      expect(result).toEqual(mockArticles);
      expect(mockAppService.getArticles).toHaveBeenCalled();
    });

    it('should handle empty articles array', async () => {
      mockAppService.getArticles.mockResolvedValue([]);
      
      const result = await appController.getArticles();
      expect(result).toEqual([]);
      expect(mockAppService.getArticles).toHaveBeenCalled();
    });
  });

  describe('getArticleById', () => {
    it('should return an article when found', async () => {
      const mockArticle: Article = {
        id: '1',
        title: 'Test Article',
        content: 'Test content',
        insertionDate: new Date(),
        keywords: [],
        topics: [],
        summaryLarge: '',
        summarySmall: '',
        images: [],
      };
      mockAppService.getArticleById.mockResolvedValue(mockArticle);
      
      const result = await appController.getArticleById('1');
      expect(result).toEqual(mockArticle);
      expect(mockAppService.getArticleById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when article not found', async () => {
      mockAppService.getArticleById.mockResolvedValue(null);
      
      await expect(appController.getArticleById('1')).rejects.toThrow(
        new NotFoundException('Article with ID 1 not found'),
      );
      expect(mockAppService.getArticleById).toHaveBeenCalledWith('1');
    });
  });

  describe('createArticle', () => {
    const createArticleDto: CreateArticleDto = {
      title: 'New Article',
      content: 'Article content',
    };

    const mockProcessedArticle: Article = {
      id: '1',
      title: 'New Article',
      content: 'Article content',
      insertionDate: new Date(),
      keywords: ['test'],
      topics: ['news'],
      summaryLarge: 'Large summary',
      summarySmall: 'Small summary',
      images: ['image.jpg'],
    };

    it('should create and return a new article', async () => {
      mockAppService.processNewArticle.mockResolvedValue(mockProcessedArticle);
      mockAppService.createArticle.mockResolvedValue(mockProcessedArticle);
      
      const result = await appController.createArticle(createArticleDto);
      
      expect(result).toEqual(mockProcessedArticle);
      expect(mockAppService.processNewArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createArticleDto,
          insertionDate: expect.any(Date),
          keywords: [],
          topics: [],
          summaryLarge: '',
          summarySmall: '',
          images: [],
        }),
      );
      expect(mockAppService.createArticle).toHaveBeenCalledWith(mockProcessedArticle);
    });

    it('should log article information before and after processing', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockAppService.processNewArticle.mockResolvedValue(mockProcessedArticle);
      mockAppService.createArticle.mockResolvedValue(mockProcessedArticle);
      
      await appController.createArticle(createArticleDto);
      
      expect(consoleSpy).toHaveBeenNthCalledWith(1, 
        'Before processing:', 
        expect.objectContaining({
          id: undefined,
          title: createArticleDto.title,
          contentLength: createArticleDto.content.length,
        })
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 
        'After processing:', 
        expect.objectContaining({
          id: mockProcessedArticle.id,
          summaryLarge: expect.stringContaining('Large summary'),
          summarySmall: expect.stringContaining('Small summary'),
          keywordsCount: 1,
          topicsCount: 1,
          imagesCount: 1,
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle errors during article creation', async () => {
      const error = new Error('Database error');
      mockAppService.processNewArticle.mockRejectedValue(error);
      
      await expect(appController.createArticle(createArticleDto)).rejects.toThrow(error);
      expect(mockAppService.processNewArticle).toHaveBeenCalled();
      expect(mockAppService.createArticle).not.toHaveBeenCalled();
    });
  });
});
