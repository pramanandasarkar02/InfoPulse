import React from 'react';
import NewsCard, { type NewsItem } from '../components/NewsCard';
import sampleNews from '../assets/news.json';

type RawNewsItem = {
  title: string;
  description: string;
  content?: string;
  publishedAt: string;
  url: string;
  [key: string]: any; 
};

const processNews = (rawNews: RawNewsItem[]): NewsItem[] => {
  return rawNews.map(news => ({
    id: Math.random().toString(36).substring(2, 9), // better ID generation
    title: news.title,
    summary: news.description,
    content: news.content || news.description, // fallback to description if no content
    publishDate: news.publishedAt,
    url: news.url
  }));
};

type Props = {};

const Explore: React.FC<Props> = () => {
  const displayedNews = processNews(sampleNews);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Latest News</h1>
      <div className="space-y-6">
        {displayedNews.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Explore;