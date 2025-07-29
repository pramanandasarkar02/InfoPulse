import React from 'react';
import { NewsArticle } from '../services/NewsService';

type Props = {
  article: NewsArticle;
  onClick: () => void;
};

const NewsArticleCard: React.FC<Props> = ({ article, onClick }) => {
  // Default image URL or placeholder
  const defaultImage = 'data:image/png;base64,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';
  const imageUrl = article.urlToImage || defaultImage;

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = defaultImage;
    target.className = "w-full h-48 object-cover bg-gray-200"; // Adjust styling for placeholder
  };

  return (
    <div 
      className="cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
      onClick={onClick}
      role="article"
    >
      {/* Image container with fixed aspect ratio */}
      <div className="w-full h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {article.publication}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(article.publishedAt).toLocaleDateString()}
          </span>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {article.title}
        </h2>
        
        <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
          {article.description}
        </p>
        
        <div className="mt-auto">
          <button 
            className="text-blue-600 hover:text-blue-800 font-medium text-sm w-full text-right"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Read more →
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsArticleCard;