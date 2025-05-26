import React, { useState, useEffect } from 'react';
import NewsCard, { type NewsItem } from '../components/NewsCard';

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
    id: Math.random().toString(36).substring(2, 9),
    title: news.title,
    summary: news.description,
    content: news.content || news.description,
    publishDate: news.publishedAt,
    url: news.url
  }));
};

const Explore: React.FC = () => {
  const [rawNews, setRawNews] = useState<RawNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:3000/news');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        console.log(response)
        const data = await response.json();
        setRawNews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  const displayedNews = processNews(rawNews);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading news...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Latest News</h1>
      <div className="space-y-6">
        {displayedNews.length > 0 ? (
          displayedNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))
        ) : (
          <p>No news available</p>
        )}
      </div>
    </div>
  );
};

export default Explore;