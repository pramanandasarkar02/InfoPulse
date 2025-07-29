// ArticleDetails.js - Final improved version
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import newsService from '../services/NewsService';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaNewspaper, 
  FaExternalLinkAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { BiCategory } from 'react-icons/bi';
import { ImSpinner8 } from 'react-icons/im';

const ArticleDetails = () => {
    const { title } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const getArticleDetails = async () => {
            try {
                setLoading(true);
                const response = await newsService.getArticleByTitle(title);
                setArticle(response.data);
            } catch (err) {
                console.error('Error fetching article details:', err);
                setError('Failed to load article details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (title) {
            getArticleDetails();
        }
    }, [title]);

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMMM d, yyyy');
        } catch {
            return dateString;
        }
    };

    const handleNextImage = () => {
        setCurrentImageIndex(prev => 
            prev === article.images.length - 1 ? 0 : prev + 1
        );
    };

    const handlePrevImage = () => {
        setCurrentImageIndex(prev => 
            prev === 0 ? article.images.length - 1 : prev - 1
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <ImSpinner8 className="inline-block animate-spin text-3xl text-blue-500 mb-2" />
                        <p className="text-gray-600">Loading article...</p>
                    </div>
                </div>
                
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center max-w-md mx-4">
                        <p className="text-red-500 text-lg mb-4">{error}</p>
                        <button 
                            onClick={() => navigate(-1)}
                            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <FaArrowLeft /> Go Back
                        </button>
                    </div>
                </div>
               
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            
            <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
                <button 
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors gap-2"
                >
                    <FaArrowLeft /> Back to Articles
                </button>
                
                {article && (
                    <article className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-6 md:p-8">
                            {/* Enhanced Metadata Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <BiCategory className="text-blue-600" />
                                        <span className="font-semibold">Category:</span>
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                            {article.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaNewspaper className="text-blue-600" />
                                        <span className="font-semibold">Publication:</span>
                                        <span>{article.publication}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-blue-600" />
                                        <span className="font-semibold">Published:</span>
                                        <span>{formatDate(article.insertion_date)}</span>
                                    </div>
                                    {article.url && (
                                        <div className="flex items-center gap-2">
                                            <FaExternalLinkAlt className="text-blue-600" />
                                            <span className="font-semibold">Source:</span>
                                            <a 
                                                href={article.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                Original News <FaExternalLinkAlt className="text-xs" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <h1 className="text-3xl font-bold text-gray-900 mb-6">{article.title}</h1>
                            
                            {article.tags && article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {article.tags.map((tag, index) => (
                                        <span 
                                            key={index} 
                                            className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            
                            {/* Image Gallery */}
                            {article.images && article.images.length > 0 && (
                                <div className="mb-8 relative group">
                                    <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-video">
                                        <img 
                                            src={article.images[currentImageIndex]} 
                                            alt={`Article visual ${currentImageIndex + 1}`} 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    {article.images.length > 1 && (
                                        <>
                                            <button 
                                                onClick={handlePrevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <FaChevronLeft />
                                            </button>
                                            <button 
                                                onClick={handleNextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <FaChevronRight />
                                            </button>
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                                                {currentImageIndex + 1} / {article.images.length}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Markdown Content */}
                            <div className="prose max-w-none text-gray-700">
                                <ReactMarkdown>{article.content}</ReactMarkdown>
                            </div>
                        </div>
                    </article>
                )}
            </main>
            
        </div>
    );
};

export default ArticleDetails;