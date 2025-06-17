import React, { useState } from 'react';
import { Settings, User, Sparkles, Shield, Trash2 } from 'lucide-react';
import { UserPreferences } from '../types';
import { saveUserPreferences } from '../utils/localStorage';

interface SettingsPageProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  preferences,
  onPreferencesChange,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleTopicToggle = (topic: string) => {
    const updatedTopics = preferences.favoriteTopics.includes(topic)
      ? preferences.favoriteTopics.filter(t => t !== topic)
      : [...preferences.favoriteTopics, topic];
    
    const updatedPreferences = { ...preferences, favoriteTopics: updatedTopics };
    onPreferencesChange(updatedPreferences);
    saveUserPreferences(updatedPreferences);
  };

  const handleClearReadingHistory = () => {
    const updatedPreferences = { ...preferences, readingHistory: [] };
    onPreferencesChange(updatedPreferences);
    saveUserPreferences(updatedPreferences);
    setShowClearConfirm(false);
  };

  const handleClearFavorites = () => {
    const updatedPreferences = { ...preferences, favoriteArticles: [] };
    onPreferencesChange(updatedPreferences);
    saveUserPreferences(updatedPreferences);
  };

  const allTopics = [
    'Artificial Intelligence', 'Climate Change', 'Healthcare', 'Space Exploration',
    'Finance', 'Innovation', 'Politics', 'Science', 'Technology', 'Business',
    'Education', 'Environment', 'Sports', 'Entertainment', 'Cybersecurity',
    'Renewable Energy', 'Biotechnology', 'Economics'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings & Preferences
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your InfoPulse experience and manage your data
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Reading Statistics
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {preferences.readingHistory.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Articles Read
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {preferences.favoriteArticles.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Favorites Saved
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {preferences.favoriteTopics.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Favorite Topics
              </div>
            </div>
          </div>
        </div>

        {/* Topic Preferences Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Content Personalization
            </h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Favorite Topics
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Select topics you're interested in to get personalized recommendations. 
                Articles matching your preferences will appear higher in your feed.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => handleTopicToggle(topic)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                      preferences.favoriteTopics.includes(topic)
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Data Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Privacy & Data Management
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Clear Reading History
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remove all articles from your reading history ({preferences.readingHistory.length} articles)
                </p>
              </div>
              {showClearConfirm ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleClearReadingHistory}
                    className="px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Clear Favorites
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remove all saved favorite articles ({preferences.favoriteArticles.length} articles)
                </p>
              </div>
              <button
                onClick={handleClearFavorites}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            About InfoPulse
          </h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              InfoPulse is your personalized news companion, delivering curated content based on your interests and reading habits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Key Features
                </h3>
                <ul className="space-y-1 text-sm">
                  <li>• Personalized news recommendations</li>
                  <li>• Advanced search and filtering</li>
                  <li>• Reading progress tracking</li>
                  <li>• Favorite articles management</li>
                  <li>• Topic-based personalization</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Privacy & Security
                </h3>
                <ul className="space-y-1 text-sm">
                  <li>• Local data storage only</li>
                  <li>• No external data tracking</li>
                  <li>• Complete user control</li>
                  <li>• Anonymous usage analytics</li>
                  <li>• Secure authentication</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};