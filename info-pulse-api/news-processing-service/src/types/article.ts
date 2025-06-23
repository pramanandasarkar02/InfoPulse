// types/article.ts
export interface RawArticle {
  id?: string;
  title: string;
  content: string;
  url?: string;
  author?: string;
  source?: string;
  insertionDate: Date;
  summaryLarge?: string;
  summarySmall?: string;
  keywords: string[];
  topics: string[];
  images: string[];
  rawHtml?: string; // This won't be saved to database
}