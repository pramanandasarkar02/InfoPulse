// Explore.js - Fixed version
import React, { useEffect, useState } from 'react';
import { FiClock, FiUser, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaNewspaper, FaSearch } from 'react-icons/fa';
import newsService from '../services/NewsService';
import { useNavigate } from 'react-router-dom';

const Explore = () => {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [visibleArticles, setVisibleArticles] = useState([]);
    const [articlesToShow, setArticlesToShow] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [timeFilter, setTimeFilter] = useState('');
    const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [articlesRes, categoriesRes] = await Promise.all([
                    newsService.getArticles(),
                    newsService.getCategories()
                ]);
                
                setArticles(articlesRes.data.articles);
                setCategories(categoriesRes.data.categories);
                setVisibleArticles(articlesRes.data.articles.slice(0, articlesToShow));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...articles];
        
        // Filter by category if one is selected
        if (selectedCategory) {
            filtered = filtered.filter(article => 
                article.category && 
                (typeof article.category === 'string' 
                    ? article.category.toLowerCase() === selectedCategory.toLowerCase()
                    : article.category.name.toLowerCase() === selectedCategory.toLowerCase())
            );
        }
        
        // Filter by search query if one exists
        if (searchQuery) {
            filtered = filtered.filter(article => 
                (article.title && article.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (article.description && article.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Filter by timeline
        if (timeFilter) {
            const now = new Date();
            filtered = filtered.filter(article => {
                if (!article.publishedAt) return false;
                const articleDate = new Date(article.publishedAt);
                if (timeFilter === 'today') {
                    return articleDate.toDateString() === now.toDateString();
                } else if (timeFilter === 'this-week') {
                    const weekAgo = new Date(now);
                    weekAgo.setDate(now.getDate() - 7);
                    return articleDate >= weekAgo;
                } else if (timeFilter === 'this-month') {
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(now.getMonth() - 1);
                    return articleDate >= monthAgo;
                }
                return true;
            });
        }
        
        setVisibleArticles(filtered.slice(0, articlesToShow));
    }, [articles, selectedCategory, searchQuery, timeFilter, articlesToShow]);

    const loadMoreArticles = () => {
        setArticlesToShow(prev => prev + 12);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Date not available';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch {
            return 'Invalid date';
        }
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(typeof category === 'string' ? category : category.name);
        setIsCategoryOpen(false);
        setArticlesToShow(20);
    };

    const handleTimeFilterSelect = (filter) => {
        setTimeFilter(filter);
        setIsTimeFilterOpen(false);
        setArticlesToShow(20);
    };

    const handleReadMoreClick = (article) => {
        navigate(`/article/${article.title}`);
    };

    const clearFilters = () => {
        setSelectedCategory('');
        setSearchQuery('');
        setTimeFilter('');
        setArticlesToShow(20);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0 flex items-center">
                    <FaNewspaper className="mr-2" /> Explore the Latest News
                </h1>
                
                <div className="w-full md:w-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative">
                        <div 
                            className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer w-full md:w-64"
                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        >
                            <span>{selectedCategory || 'All Categories'}</span>
                            {isCategoryOpen ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                        {isCategoryOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                <div 
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleCategorySelect('')}
                                >
                                    All Categories
                                </div>
                                {categories.map((category, index) => (
                                    <div 
                                        key={index}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleCategorySelect(category)}
                                    >
                                        {typeof category === 'string' ? category : category.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <div 
                            className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer w-full md:w-64"
                            onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
                        >
                            <span>{timeFilter ? timeFilter.replace('-', ' ') : 'All Time'}</span>
                            {isTimeFilterOpen ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                        {isTimeFilterOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                <div 
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleTimeFilterSelect('')}
                                >
                                    All Time
                                </div>
                                {['today', 'this-week', 'this-month'].map((filter, index) => (
                                    <div 
                                        key={index}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleTimeFilterSelect(filter)}
                                    >
                                        {filter.replace('-', ' ')}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search news..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                </div>
            </div>

            {(selectedCategory || searchQuery || timeFilter) && (
                <div className="mb-4 flex items-center">
                    <span className="text-sm text-gray-600 mr-2">
                        {selectedCategory && `Category: ${selectedCategory}`}
                        {searchQuery && `${selectedCategory ? ' | ' : ''}Search: "${searchQuery}"`}
                        {timeFilter && `${(selectedCategory || searchQuery) ? ' | ' : ''}Time: ${timeFilter.replace('-', ' ')}`}
                    </span>
                    <button 
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear filters
                    </button>
                </div>
            )}
            
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600">Loading articles...</p>
                </div>
            ) : visibleArticles.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No articles found. Try a different search or category.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {visibleArticles.map((article, index) => (
                            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                                <div className="h-48 overflow-hidden">
                                    <img 
                                        src={article.urlToImage || 'https://via.placeholder.com/300x200?text=No+Image'} 
                                        alt={article.title || 'News image'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                        }}
                                    />
                                </div>
                                <div className="p-4 flex-grow">
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <FiClock className="mr-1" />
                                        <span>{formatDate(article.publishedAt)}</span>
                                    </div>
                                    <h2 className="text-xl font-semibold mb-2 line-clamp-2">{article.title || 'Untitled Article'}</h2>
                                    <p className="text-gray-600 mb-3 line-clamp-3">{article.description || 'No description available.'}</p>
                                    <div className="flex justify-between items-center text-sm text-gray-500 mt-auto">
                                        <div className="flex items-center">
                                            <FiUser className="mr-1" />
                                            <span>{article.author || 'Unknown Author'}</span>
                                        </div>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                            {typeof article.category === 'string' ? article.category : article.category?.name || 'General'}
                                        </span>
                                    </div>
                                </div>
                                <div className='flex justify-between gap-2'>
                                    <button
                                        onClick={() => handleReadMoreClick(article)}
                                        className="block w-full bg-blue-600 text-white text-center py-2 hover:bg-blue-700 transition-colors duration-300"
                                    >
                                        Read More
                                    </button>
                                    <a 
                                        href={article.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block w-full bg-blue-600 text-white text-center py-2 hover:bg-blue-700 transition-colors duration-300"
                                    >
                                        Read Original Article
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {articlesToShow < articles.length && visibleArticles.length >= articlesToShow && (
                        <div className="text-center mt-8">
                            <button
                                onClick={loadMoreArticles}
                                className="bg-white border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-300"
                            >
                                Load More Articles
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Explore;