import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBookmark, FiClock, FiExternalLink, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { FaRegNewspaper } from 'react-icons/fa';
import recommendations from '../services/Recommendation';

// Fisher-Yates shuffle function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Feed = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Common news categories
  const categories = [
    { id: 'all', name: 'All News', icon: '📰' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'health', name: 'Health', icon: '🏥' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'politics', name: 'Politics', icon: '🏛️' },
    { id: 'world', name: 'World', icon: '🌍' },
    { id: 'lifestyle', name: 'Lifestyle', icon: '✨' },
  ];

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await recommendations.recommendationByCategory();
      const shuffledArticles = shuffleArray(response.data.articles);
      setArticles(shuffledArticles);
      setFilteredArticles(shuffledArticles);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredArticles(shuffleArray(articles));
    } else {
      const filtered = articles.filter(
        (article) =>
          article.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          article.title?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          article.description?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      setFilteredArticles(shuffleArray(filtered));
    }
  }, [selectedCategory, articles]);

  const handleReadMoreClick = (article) => {
    navigate(`/article/${article.title}`);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleRefresh = () => {
    fetchArticles();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex-shrink-0`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`font-bold text-gray-800 ${sidebarOpen ? 'block' : 'hidden'}`}>
              Categories
            </h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <FiFilter className="text-gray-600" />
            </button>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="text-lg mr-3">{category.icon}</span>
                <span className={`font-medium ${sidebarOpen ? 'block' : 'hidden'}`}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaRegNewspaper className="text-3xl text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">
                {selectedCategory === 'all'
                  ? 'Your Personalized News Feed'
                  : categories.find((cat) => cat.id === selectedCategory)?.name + ' News'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">{filteredArticles.length} articles</div>
              <button
                onClick={handleRefresh}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-3 py-2 rounded-lg hover:border-gray-400 transition-colors duration-200"
              >
                <FiRefreshCw className="mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Articles in Row Layout */}
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <div
              key={article._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <div className="flex">
                {/* Article Image */}
                <div className="w-48 h-32 flex-shrink-0">
                  <img
                    src={article.urlToImage || 'https://via.placeholder.com/192x128?text=No+Image'}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/192x128?text=No+Image';
                    }}
                  />
                </div>

                {/* Article Content */}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {article.source?.name || 'Unknown Source'}
                      </span>
                      <span className="text-gray-500 text-sm flex items-center">
                        <FiClock className="mr-1" />
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-blue-500">
                      <FiBookmark />
                    </button>
                  </div>

                  <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    {article.title}
                  </h2>

                  <p className="text-gray-700 mb-3 line-clamp-2">{article.description}</p>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => handleReadMoreClick(article)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Read Summary
                    </button>
                    <button
                      onClick={() => window.open(article.url, '_blank')}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-3 py-2 rounded-lg hover:border-gray-400 transition-colors duration-200"
                    >
                      Original <FiExternalLink className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No articles message */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📰</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No articles found</h3>
            <p className="text-gray-500">Try selecting a different category or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;