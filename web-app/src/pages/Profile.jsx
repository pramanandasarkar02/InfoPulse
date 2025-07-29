import React, { useState, useEffect } from 'react';
import { FiSave, FiUser, FiMail, FiCalendar, FiLock, FiCheck } from 'react-icons/fi';
import recommendations from '../services/Recommendation';
import newsService from '../services/NewsService';
import { authService } from '../services/AuthService';

const Profile = () => {
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchAllCategories = async () => {
            try {
                const response = await newsService.getCategories();
                // Corrected: Access the categories array properly
                setAllCategories(response.data.categories.map(cat => cat.name));
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        const getUserCategories = () => {
            const userCategories = recommendations.getCategories();
            setSelectedCategories(userCategories);
        };

        const loadProfile = async () => {
            try {
                const response = await authService.getProfile();
                console.log(response.data);
                setProfile(response.data.user);
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        };

        const initializeData = async () => {
            setLoading(true);
            await Promise.all([
                fetchAllCategories(),
                loadProfile()
            ]);
            getUserCategories();
            setLoading(false);
        };

        initializeData();
    }, []);

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleSave = () => {
        recommendations.setCategories(selectedCategories);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    // Format the date to be more readable
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Profile Settings</h1>
            
            {/* User Information Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                    <FiUser className="mr-2" /> User Information
                </h2>
                <div className="space-y-3">
                    <p className="flex items-center text-gray-600">
                        <span className="font-medium w-32">Username:</span> 
                        <span>{profile.username || 'N/A'}</span>
                    </p>
                    <p className="flex items-center text-gray-600">
                        <span className="font-medium w-32">Email:</span>
                        <span>{profile.email || 'N/A'}</span>
                    </p>
                    <p className="flex items-center text-gray-600">
                        <span className="font-medium w-32">Role:</span>
                        <span>{profile.role === 'super_admin' | profile.role === 'moderator' ? 'Admin' : 'User'}</span>
                    </p>
                    <p className="flex items-center text-gray-600">
                        <span className="font-medium w-32">Joined At:</span>
                        <span>{formatDate(profile.created_at)}</span>
                    </p>
                </div>
            </div>

            {/* Categories Selection Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">News Preferences</h2>
                <p className="text-gray-600 mb-4">Select your preferred news categories to personalize your feed:</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                    {allCategories.map((category) => (
                        <label key={category} className="flex items-center space-x-2 cursor-pointer">
                            <div className={`relative w-5 h-5 rounded border ${selectedCategories.includes(category) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                {selectedCategories.includes(category) && (
                                    <FiCheck className="absolute text-white" size={14} />
                                )}
                                <input
                                    type="checkbox"
                                    className="absolute opacity-0 cursor-pointer"
                                    checked={selectedCategories.includes(category)}
                                    onChange={() => handleCategoryToggle(category)}
                                />
                            </div>
                            <span className="text-gray-700">{category}</span>
                        </label>
                    ))}
                </div>
                
                <button 
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    <FiSave className="mr-2" />
                    Save Preferences
                </button>
                
                {saveSuccess && (
                    <div className="mt-3 text-green-600 flex items-center">
                        <FiCheck className="mr-1" /> Preferences saved successfully!
                    </div>
                )}
            </div>

            {/* Privacy Policy Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                    <FiLock className="mr-2" /> Data Privacy Information
                </h2>
                
                <div className="space-y-4 text-gray-600">
                    <div>
                        <h3 className="font-medium text-gray-700 mb-1">1. Data Collection</h3>
                        <p>
                            We collect only necessary information to provide and improve our service. This includes your 
                            account details, reading preferences, and interaction data to deliver personalized content.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="font-medium text-gray-700 mb-1">2. How We Use Your Data</h3>
                        <p>
                            Your information helps us customize your news feed, improve recommendation algorithms, and 
                            enhance your overall experience. We analyze reading patterns anonymously to improve our 
                            service quality.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="font-medium text-gray-700 mb-1">3. Data Protection</h3>
                        <p>
                            We implement industry-standard security measures to protect your information. All data is 
                            encrypted and stored securely. We never sell your personal data to third parties.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="font-medium text-gray-700 mb-1">4. Your Control</h3>
                        <p>
                            You can update your preferences anytime through this profile page. For data access or deletion 
                            requests, please contact our support team. We're committed to transparency about your data.
                        </p>
                    </div>
                    
                    <div className="pt-2">
                        <p className="text-sm text-gray-500">
                            Last updated: {formatDate(new Date())}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;