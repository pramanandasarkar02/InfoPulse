// NewsArticleDetails.tsx
import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiClock, FiExternalLink } from 'react-icons/fi';
import { FaRegNewspaper } from 'react-icons/fa';
import { HiOutlinePhotograph } from 'react-icons/hi';
import newsService, { NewsArticle } from '../services/NewsService';

type Props = {
  articleUrl: string;
  articleTitle: string;
  onBack: () => void;
};




const NewsArticleDetails: React.FC<Props> = ({ articleUrl, articleTitle, onBack }) => {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getArticleDetails = async () => {
      try {
        setLoading(true);
        const fetchedArticle = await newsService.getArticleByTitle(articleTitle);
        if (fetchedArticle.data) {
            console.log(fetchedArticle.data);
            
          setArticle(fetchedArticle.data);
        } else {
          setError('Article not found');
        }
      } catch (err) {
        setError('Failed to load article details');
        console.error("Error fetching article:", err);
      } finally {
        setLoading(false);
      }
    };
    
    getArticleDetails();
  }, [articleTitle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button 
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <FiArrowLeft className="mr-2" /> Back to Feed
        </button>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Back to Feed
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Article Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{article.title}</h2>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <FaRegNewspaper className="mr-2" />
                <span>{article.publication}</span>
              </div>
              
              <div className="flex items-center">
                <FiClock className="mr-2" />
                <span>{article.reading_time || 5} min read</span>
              </div>
              
              {article.insertion_date && (
                <div>
                  Published: {new Date(article.insertion_date).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Article Image */}
            <div className="relative w-full h-64 md:h-96 bg-gray-200">
            {article.images?.length > 0 ? (
                <>
                <img 
                    src={article.images[0]} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded flex items-center">
                    <HiOutlinePhotograph className="mr-1" />
                    <span className="text-xs">1/{article.images.length}</span>
                </div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                {/* Default image placeholder - you can replace this with an actual image if you want */}
                <HiOutlinePhotograph className="text-4xl text-gray-400" />
                </div>
            )}
            </div>

          {/* Article Content */}
          <div className="p-6">
            <div className="prose max-w-none">
              <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                {article.content}
              </p>
            </div>            

            {/* Tags */}
            {article.tags?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* External Link */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                Read the full article <FiExternalLink className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsArticleDetails;