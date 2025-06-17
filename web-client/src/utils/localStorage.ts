import { UserPreferences } from '../types';

const STORAGE_KEYS = {
  USER_PREFERENCES: 'infopulse_user_preferences',
  READING_HISTORY: 'infopulse_reading_history',
};

export const defaultPreferences: UserPreferences = {
  favoriteTopics: [],
  readingHistory: [],
  favoriteArticles: [],
  recommendationRatings: {},
};

export const saveUserPreferences = (preferences: UserPreferences): void => {
  localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
};

export const getUserPreferences = (): UserPreferences => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
  return stored ? JSON.parse(stored) : defaultPreferences;
};

export const addToFavorites = (articleId: string): void => {
  const preferences = getUserPreferences();
  if (!preferences.favoriteArticles.includes(articleId)) {
    preferences.favoriteArticles.push(articleId);
    saveUserPreferences(preferences);
  }
};

export const removeFromFavorites = (articleId: string): void => {
  const preferences = getUserPreferences();
  preferences.favoriteArticles = preferences.favoriteArticles.filter(id => id !== articleId);
  saveUserPreferences(preferences);
};

export const addToReadingHistory = (articleId: string): void => {
  const preferences = getUserPreferences();
  preferences.readingHistory = preferences.readingHistory.filter(id => id !== articleId);
  preferences.readingHistory.unshift(articleId);
  
  // Keep only the last 100 articles in history
  if (preferences.readingHistory.length > 100) {
    preferences.readingHistory = preferences.readingHistory.slice(0, 100);
  }
  
  saveUserPreferences(preferences);
};

export const rateRecommendation = (articleId: string, rating: number): void => {
  const preferences = getUserPreferences();
  preferences.recommendationRatings[articleId] = rating;
  saveUserPreferences(preferences);
};