import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaNewspaper, FaSearch, FaBookmark, FaBell, FaRocket } from 'react-icons/fa';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Navigation */}
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <FaNewspaper className="text-2xl text-blue-600" />
                    <span className="text-xl font-bold text-blue-800">InfoPulse</span>
                </div>
                <button 
                    onClick={() => navigate('/explore')}
                    className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                    Get Started
                </button>
            </nav>

            {/* Hero Section */}
            <div className="container mx-auto px-6 py-16 md:py-24">
                <div className="flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 mb-12 md:mb-0">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-6">
                            Stay Informed with <span className="text-blue-600">Curated</span> News
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            Discover personalized news from trusted sources. 
                            Get updates on topics you care about, all in one place.
                        </p>
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                            <button 
                                onClick={() => navigate('/explore')}
                                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-all shadow-lg"
                            >
                                <FaRocket className="mr-2" /> Get Started
                            </button>
                            <button className="flex items-center justify-center border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg transition-all">
                                <FaBookmark className="mr-2" /> Save Articles
                            </button>
                        </div>
                    </div>
                    <div className="md:w-1/2">
                        <div className="relative bg-white p-2 rounded-xl shadow-2xl">
                            <img 
                                src="app-page.png"
                                alt="News app screenshot" 
                                className="rounded-lg border border-gray-200"
                            />
                            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-lg shadow-md">
                                <FaBell className="text-2xl text-blue-600 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-white py-16">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose NewsHub?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-blue-50 p-6 rounded-xl">
                            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <FaSearch className="text-blue-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
                            <p className="text-gray-600">
                                Find exactly what you're looking for with our powerful search technology.
                            </p>
                        </div>
                        <div className="bg-indigo-50 p-6 rounded-xl">
                            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <FaBookmark className="text-indigo-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Save Articles</h3>
                            <p className="text-gray-600">
                                Bookmark your favorite stories to read later across all your devices.
                            </p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-xl">
                            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <FaBell className="text-purple-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Personalized Alerts</h3>
                            <p className="text-gray-600">
                                Get notified about breaking news and updates on your favorite topics.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-blue-600 py-16">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to Explore the News?</h2>
                    <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of readers who stay informed with our curated news experience.
                    </p>
                    <button 
                        onClick={() => navigate('/explore')}
                        className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-medium transition-all shadow-lg"
                    >
                        Get Started Now
                    </button>
                </div>
            </div>

            
        </div>
    );
};

export default HomePage;