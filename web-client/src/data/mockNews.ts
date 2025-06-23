// This file is kept for fallback purposes but is no longer the primary data source
import { NewsArticle } from '../types';

export const categories = [
  'Technology',
  'Business',
  'Science',
  'Health',
  'Sports',
  'Entertainment',
  'Politics',
  'World',
  'Environment',
  'Education'
];

// Fallback data in case API is unavailable
export const mockNews: NewsArticle[] = [
  {
    id: 'fallback-1',
    title: 'API Connection Required',
    summary: 'Please ensure your news API is running on localhost:3001 to see real news data.',
    content: 'This is a fallback article displayed when the news API is not available. The application is configured to fetch real news data from your API endpoint.',
    author: 'System',
    publishedAt: new Date().toISOString(),
    imageUrl: 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Technology',
    tags: ['API', 'System', 'Configuration'],
    source: 'InfoPulse System',
    readTime: 1
  }
];