// app.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { Article, ArticleDocument } from './article.schema';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Model } from 'mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { RawArticle } from './types/article';

jest.mock('@google/generative-ai');
jest.mock('axios');

describe('AppService', () => {
  let service: AppService;
  let articleModel: Model<ArticleDocument>;

  const mockArticleModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockGenerativeModel = {
    generateContent: jest.fn(),
  };

  const mockGoogleGenerativeAI = {
    getGenerativeModel: jest.fn().mockReturnValue(mockGenerativeModel),
  };

  beforeEach(async () => {
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => mockGoogleGenerativeAI);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getModelToken(Article.name),
          useValue: mockArticleModel,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    articleModel = module.get<Model<ArticleDocument>>(getModelToken(Article.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(service.getHello()).toBe('Hello World!');
    });
  });

  describe('getPing', () => {
    it('should return "pong"', () => {
      expect(service.getPing()).toBe('pong');
    });
  });

  describe('createArticle', () => {
    const rawArticle: RawArticle = {
      id: '123',
      title: 'Test Article',
      content: 'This is a test article content.',
      url: 'http://example.com',
      rawHtml: '<p>Test</p>',
      insertionDate: new Date('2025-07-08T12:00:00Z'),
      keywords: [],
      topics: [],
      images: [],
    };

    it('should create and save an article successfully', async () => {
      const savedArticle = { ...rawArticle, _id: '123', save: jest.fn() };
      mockArticleModel.create.mockResolvedValue(savedArticle);

      const result = await service.createArticle(rawArticle);

      expect(mockArticleModel.create).toHaveBeenCalledWith({
        id: '123',
        title: 'Test Article',
        content: 'This is a test article content.',
        url: 'http://example.com',
        insertionDate: expect.any(Date),
        keywords: [],
        topics: [],
        images: [],
      });
      expect(result).toEqual(savedArticle);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      mockArticleModel.create.mockRejectedValue(new Error('DB Error'));

      await expect(service.createArticle(rawArticle)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getArticles', () => {
    it('should return all articles', async () => {
      const articles = [
        {
          id: '1',
          title: 'Article 1',
          content: 'Content 1',
          url: 'http://example.com/1',
          insertionDate: new Date(),
          keywords: [],
          topics: [],
          images: [],
        },
        {
          id: '2',
          title: 'Article 2',
          content: 'Content 2',
          url: 'http://example.com/2',
          insertionDate: new Date(),
          keywords: [],
          topics: [],
          images: [],
        },
      ];
      mockArticleModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue(articles) });

      const result = await service.getArticles();

      expect(mockArticleModel.find).toHaveBeenCalled();
      expect(result).toEqual(articles);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      mockArticleModel.find.mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error('DB Error')) });

      await expect(service.getArticles()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getArticleById', () => {
    it('should return article by ID', async () => {
      const article = {
        id: '123',
        title: 'Test Article',
        content: 'Content',
        url: 'http://example.com',
        insertionDate: new Date(),
        keywords: [],
        topics: [],
        images: [],
      };
      mockArticleModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(article) });

      const result = await service.getArticleById('123');

      expect(mockArticleModel.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(article);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      mockArticleModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB Error')),
      });

      await expect(service.getArticleById('123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('processNewArticle', () => {
    const rawArticle: RawArticle = {
      id: '123',
      title: 'Test Article',
      content: 'This is a test article content.',
      url: 'http://example.com',
      insertionDate: new Date('2025-07-08T12:00:00Z'),
      keywords: [],
      topics: [],
      images: [],
    };

    beforeEach(() => {
      mockGenerativeModel.generateContent.mockImplementation((prompt: string) => {
        if (prompt.includes('comprehensive summary')) {
          return { response: { text: () => 'Large summary text' } };
        } else if (prompt.includes('brief summary')) {
          return { response: { text: () => 'Small summary text' } };
        } else if (prompt.includes('keywords')) {
          return { response: { text: () => 'keyword1, keyword2, keyword3' } };
        } else if (prompt.includes('topics')) {
          return { response: { text: () => 'Politics, Technology' } };
        }
      });

      (axios.get as jest.Mock).mockResolvedValue({
        data: '<html><img src="http://example.com/image.jpg"></html>',
      });
      (cheerio.load as jest.Mock).mockReturnValue(() => ({
        'img[src]': jest.fn().mockReturnValue([{ attr: () => 'http://example.com/image.jpg' }]),
        'meta[property="og:image"]': jest.fn().mockReturnValue([]),
        'meta[name="twitter:image"]': jest.fn().mockReturnValue([]),
        'link[rel="image_src"]': jest.fn().mockReturnValue([]),
      }));
    });

    it('should process article with AI-generated content', async () => {
      const result = await service.processNewArticle(rawArticle);

      expect(result).toEqual({
        ...rawArticle,
        summaryLarge: 'Large summary text',
        summarySmall: 'Small summary text',
        keywords: ['keyword1', 'keyword2', 'keyword3'],
        topics: ['Politics', 'Technology'],
        images: ['http://example.com/image.jpg'],
      });
    });

    it('should use fallback methods when AI fails', async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(new Error('API Error'));

      const result = await service.processNewArticle(rawArticle);

      expect(result.summaryLarge).toBe('This is a test article content.');
      expect(result.summarySmall).toBe('This is a test article content.');
      expect(result.keywords).toContain('test');
      expect(result.topics).toContain('General News');
      expect(result.images).toEqual(['http://example.com/image.jpg']);
    });

    it('should handle rate limiting errors with retries', async () => {
      mockGenerativeModel.generateContent
        .mockRejectedValueOnce({ status: 429, message: 'Rate limit exceeded' })
        .mockResolvedValueOnce({ response: { text: () => 'Large summary text' } });

      const result = await service.processNewArticle(rawArticle);

      expect(mockGenerativeModel.generateContent).toHaveBeenCalledTimes(5); // Initial + retry
      expect(result.summaryLarge).toBe('Large summary text');
    });

    it('should handle empty content gracefully', async () => {
      const emptyArticle: RawArticle = { ...rawArticle, content: '' };

      const result = await service.processNewArticle(emptyArticle);

      expect(result.summaryLarge).toBe('');
      expect(result.summarySmall).toBe('');
      expect(result.keywords).toEqual([]);
      expect(result.topics).toEqual(['General News']);
      expect(result.images).toEqual(['http://example.com/image.jpg']);
    });
  });

  describe('extractImagesFromUrl', () => {
    it('should extract images from URL', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: '<html><img src="/image.jpg"></html>',
      });
      (cheerio.load as jest.Mock).mockReturnValue(() => ({
        'img[src]': jest.fn().mockReturnValue([{ attr: () => '/image.jpg' }]),
        'meta[property="og:image"]': jest.fn().mockReturnValue([]),
        'meta[name="twitter:image"]': jest.fn().mockReturnValue([]),
        'link[rel="image_src"]': jest.fn().mockReturnValue([]),
      }));

      const images = await service['extractImagesFromUrl']('http://example.com');

      expect(images).toEqual(['http://example.com/image.jpg']);
    });

    it('should return empty array on error', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const images = await service['extractImagesFromUrl']('http://example.com');

      expect(images).toEqual([]);
    });
  });

  describe('fallback methods', () => {
    it('should generate fallback large summary', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const summary = service['generateFallbackLargeSummary'](text);
      expect(summary).toBe('First sentence. Second sentence. Third sentence.');
    });

    it('should generate fallback small summary', () => {
      const text = 'First sentence here.';
      const summary = service['generateFallbackSmallSummary'](text);
      expect(summary).toBe('First sentence here.');
    });

    it('should generate fallback keywords', () => {
      const text = 'This is a test article test content';
      const keywords = service['generateFallbackKeywords'](text);
      expect(keywords).toContain('test');
    });

    it('should generate fallback topics', () => {
      const text = 'This article is about technology and innovation';
      const topics = service['generateFallbackTopics'](text);
      expect(topics).toContain('Technology');
    });
  });
});