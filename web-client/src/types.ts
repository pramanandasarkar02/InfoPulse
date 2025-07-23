export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  publishedAt: string;
  imageUrl: string;
  category: string;
  tags: string[];
  source: string;
  readTime: number;
  url: string;
  isFavorited: boolean;
}

export interface Category {
  id: number;
  name: string;
}