// App.tsx
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { NewsFeed } from './components/NewsFeed';
import { ExplorePage } from './components/ExplorePage';
import { ArticleDetail } from './components/ArticleDetail';
import { FavoritesPage } from './components/FavoritesPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthModal } from './components/AuthModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AdminDashboard } from './components/AdminDashboard';
import { NewsUploadPage } from './components/NewsUploadPage';
import { UsersManagement } from './components/UsersManagement';
import { CategoriesManagement } from './components/CategoriesManagement';
import { NewsArticle } from './services/NewsService';
import authService, { User } from './services/AuthService';

type CurrentPage = 'feed' | 'explore' | 'favorites' | 'settings' | 'admin' | 'upload' | 'users' | 'categories' | 'article';

interface Filters {
  category?: string;
  search?: string;
}

interface Preferences {
  theme?: 'light' | 'dark';
  notifications?: boolean;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('feed');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [intendedPage, setIntendedPage] = useState<CurrentPage | null>(null);
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [authLoading, setAuthLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [favoriteArticles, setFavoriteArticles] = useState<NewsArticle[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>({ theme: 'light', notifications: true });

  const refreshArticles = async () => {
    setNewsLoading(true);
    try {
      // Assuming newsService exists and is imported
      // const response = await newsService.getArticles(filters);
      // setArticles(response.data);
      setNewsError(null);
    } catch (error) {
      setNewsError('Failed to load articles');
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setAuthLoading(true);
      const isAuthenticated = await authService.refreshAuth();
      if (isAuthenticated) {
        setUser(authService.getCurrentUser());
      }
      setAuthLoading(false);
      setAvailableCategories(['politics', 'technology', 'sports']);
      refreshArticles();
    };

    initialize();
  }, []);

  useEffect(() => {
    if (authService.isAuthenticated() && intendedPage) {
      if (
        (intendedPage === 'admin' || intendedPage === 'upload' || intendedPage === 'users' || intendedPage === 'categories') &&
        user?.role !== 'admin'
      ) {
        setAuthError('Access denied: Admin privileges required');
        return;
      }
      setCurrentPage(intendedPage);
      setShowAuthModal(false);
      setIntendedPage(null);
    }
  }, [user, intendedPage]);

  const handlePageChange = (page: CurrentPage) => {
    if (!authService.isAuthenticated() && ['favorites', 'settings', 'admin', 'upload', 'users', 'categories'].includes(page)) {
      setIntendedPage(page);
      setShowAuthModal(true);
      return;
    }
    if (['admin', 'upload', 'users', 'categories'].includes(page) && user?.role !== 'admin') {
      setAuthError('Access denied: Admin privileges required');
      return;
    }
    setCurrentPage(page);
    setIntendedPage(null);
  };

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setCurrentPage('article');
  };

  const handleBackToFeed = () => {
    setCurrentPage('feed');
    setSelectedArticle(null);
  };

  const handleLogin = async (username: string, password: string) => {
    setAuthError(null);
    const response = await authService.login({ username, password });
    if (response.error) {
      setAuthError(response.error);
      return false;
    }
    setUser(authService.getCurrentUser());
    return true;
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    setAuthError(null);
    const response = await authService.signup({ username, email, password, confirmPassword: password });
    if (response.error) {
      setAuthError(response.error);
      return false;
    }
    setUser(authService.getCurrentUser());
    return true;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setCurrentPage('feed');
    setShowAuthModal(false);
    setFavoriteArticles([]);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'explore':
        return (
          <ExplorePage
            articles={articles}
            availableCategories={availableCategories}
            onArticleClick={handleArticleClick}
            loading={newsLoading}
            error={newsError}
            onRefresh={refreshArticles}
          />
        );
      case 'favorites':
        if (!authService.isAuthenticated()) {
          setShowAuthModal(true);
          return <NewsFeed  onArticleClick={handleArticleClick} />;
        }
        return <FavoritesPage articles={favoriteArticles} onArticleClick={handleArticleClick} />;
      case 'settings':
        if (!authService.isAuthenticated()) {
          setShowAuthModal(true);
          return <NewsFeed  onArticleClick={handleArticleClick} />;
        }
        return <SettingsPage preferences={preferences} onPreferencesChange={setPreferences} />;
      case 'article':
        return selectedArticle ? (
          <ArticleDetail article={selectedArticle} onBack={handleBackToFeed} />
        ) : (
          <NewsFeed  onArticleClick={handleArticleClick} />
        );
      case 'admin':
        if (!authService.isAuthenticated() || user?.role !== 'admin') {
          setShowAuthModal(true);
          return <NewsFeed  onArticleClick={handleArticleClick} />;
        }
        return <AdminDashboard user={user!} onPageChange={handlePageChange} />;
      case 'upload':
        if (!authService.isAuthenticated() || user?.role !== 'admin') {
          setShowAuthModal(true);
          return <NewsFeed  onArticleClick={handleArticleClick} />;
        }
        return <NewsUploadPage user={user!} />;
      case 'users':
        if (!authService.isAuthenticated() || user?.role !== 'admin') {
          setShowAuthModal(true);
          return <NewsFeed  onArticleClick={handleArticleClick} />;
        }
        return <UsersManagement user={user!} />;
      case 'categories':
        if (!authService.isAuthenticated() || user?.role !== 'admin') {
          setShowAuthModal(true);
          return <NewsFeed  onArticleClick={handleArticleClick} />;
        }
        return <CategoriesManagement user={user!} />;
      default:
        return <NewsFeed  onArticleClick={handleArticleClick} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white dark:text-gray-900 font-bold text-sm">IP</span>
          </div>
          <LoadingSpinner size="medium" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading InfoPulse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header
        filters={filters}
        onFiltersChange={setFilters}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
        onLogout={logout}
      />

      <div className="flex">
        {currentPage === 'feed' && (
          <Sidebar
            isOpen={sidebarOpen}
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setSidebarOpen(false)}
            availableCategories={availableCategories}
            onRefresh={refreshArticles}
            isRefreshing={newsLoading}
          />
        )}

        <main className={`flex-1 transition-all duration-200 ${currentPage === 'feed' ? 'lg:ml-80' : ''}`}>
          {renderCurrentPage()}
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setAuthError(null);
        }}
        onLogin={handleLogin}
        onRegister={handleRegister}
        error={authError}
      />
    </div>
  );
};

export default App;