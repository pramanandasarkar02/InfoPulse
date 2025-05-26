import React from 'react';
import { FaArrowUp, FaArrowDown, FaBookmark, FaRegBookmark } from 'react-icons/fa';

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  publishDate: string;
  url: string;
};

type NewsCardProps = {
  item: NewsItem;
};

const NewsCard: React.FC<NewsCardProps> = ({ item }) => {
  const [upvoted, setUpvoted] = React.useState(false);
  const [downvoted, setDownvoted] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleVote = (type: 'up' | 'down') => {
    if (type === 'up') {
      setUpvoted(!upvoted);
      if (downvoted) setDownvoted(false);
    } else {
      setDownvoted(!downvoted);
      if (upvoted) setUpvoted(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mb-6 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-2">
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-200"
        >
          {item.title}
        </a>
        <button 
          onClick={() => setSaved(!saved)} 
          className="text-gray-500 hover:text-yellow-500 transition-colors duration-200"
          aria-label={saved ? "Unsave news" : "Save news"}
        >
          {saved ? <FaBookmark className="text-yellow-500" /> : <FaRegBookmark />}
        </button>
      </div>
      
      <p className="text-gray-600 mb-3">{item.content}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Date(item.publishDate).toLocaleDateString()}</span>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => handleVote('up')} 
            className={`flex items-center space-x-1 ${upvoted ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}
          >
            <FaArrowUp />
            <span>Upvote</span>
          </button>
          
          <button 
            onClick={() => handleVote('down')} 
            className={`flex items-center space-x-1 ${downvoted ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
          >
            <FaArrowDown />
            <span>Downvote</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;