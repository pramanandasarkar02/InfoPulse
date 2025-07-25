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
import { useNews } from './hooks/useNews';
import { useAuth } from './hooks/useAuth';
import { NewsArticle, CurrentPage, SearchFilters, User } from './types/index';

const App: React.FC = () => {
  const {
    articles,
    favoriteArticles,
    availableCategories,
    filters,
    setFilters,
    preferences,
    setPreferences,
    loading: newsLoading,
    error: newsError,
    refreshArticles,
  } = useNews();

  const { user, isAuthenticated, isLoading: authLoading, login, register, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<CurrentPage>('feed');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [intendedPage, setIntendedPage] = useState<CurrentPage | null>(null);

  useEffect(() => {
    console.log('Auth state:', { user, isAuthenticated, isLoading: authLoading });
  }, [user, isAuthenticated, authLoading]);

  const handlePageChange = (page: CurrentPage) => {
    if (!isAuthenticated && (page === 'favorites' || page === 'settings' || page === 'admin' || page === 'upload' || page === 'users' || page === 'categories')) {
      setIntendedPage(page);
      setShowAuthModal(true);
      return;
    }
    if ((page === 'admin' || page === 'upload' || page === 'users' || page === 'categories') && !user?.is_admin) {
      setAuthError('Access denied: Admin privileges required');
      return;
    }
    setCurrentPage(page);
    setIntendedPage(null);
  };

  useEffect(() => {
    if (isAuthenticated && intendedPage) {
      if ((intendedPage === 'admin' || intendedPage === 'upload' || intendedPage === 'users' || intendedPage === 'categories') && !user?.is_admin) {
        setAuthError('Access denied: Admin privileges required');
        return;
      }
      setCurrentPage(intendedPage);
      setShowAuthModal(false);
      setIntendedPage(null);
    }
  }, [isAuthenticated, intendedPage, user]);

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
    const success = await login(username, password);
    if (!success) {
      setAuthError('Invalid username or password');
      return false;
    }
    return true;
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    setAuthError(null);
    const success = await register(username, email, password);
    if (!success) {
      setAuthError('Registration failed. Username or email may already exist.');
      return false;
    }
    return true;
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
        if (!isAuthenticated) {
          return (
            <NewsFeed
              // articles={articles}
              onArticleClick={handleArticleClick}
              // loading={newsLoading}
              // error={newsError}
            />
          );
        }
        return (
          <FavoritesPage
            articles={favoriteArticles}
            onArticleClick={handleArticleClick}
          />
        );
      case 'settings':
        if (!isAuthenticated) {
          return (
            <NewsFeed
              // articles={articles}
              onArticleClick={handleArticleClick}
              // loading={newsLoading}
              // error={newsError}
            />
          );
        }
        return (
          <SettingsPage
            preferences={preferences}
            onPreferencesChange={setPreferences}
          />
        );
      case 'article':
        return selectedArticle ? (
          <ArticleDetail
            article={selectedArticle}
            onBack={handleBackToFeed}
          />
        ) : null;
      case 'admin':
        if (!isAuthenticated || !user?.is_admin) {
          return (
            <NewsFeed
              // articles={articles}
              onArticleClick={handleArticleClick}
              // loading={newsLoading}
              // error={newsError}
            />
          );
        }
        return <AdminDashboard user={user} onPageChange={handlePageChange} />;
      case 'upload':
        if (!isAuthenticated || !user?.is_admin) {
          return (
            <NewsFeed
              // articles={articles}
              onArticleClick={handleArticleClick}
              // loading={newsLoading}
              // error={newsError}
            />
          );
        }
        return <NewsUploadPage user={user} />;
      case 'users':
        if (!isAuthenticated || !user?.is_admin) {
          return (
            <NewsFeed
              // articles={articles}
              onArticleClick={handleArticleClick}
              // loading={newsLoading}
              // error={newsError}
            />
          );
        }
        return <UsersManagement user={user} />;
      case 'categories':
        if (!isAuthenticated || !user?.is_admin) {
          return (
            <NewsFeed
              // articles={articles}
              onArticleClick={handleArticleClick}
              // loading={newsLoading}
              // error={newsError}
            />
          );
        }
        return <CategoriesManagement user={user} />;
      default:
        return (
          <NewsFeed
            // articles={articles}
            onArticleClick={handleArticleClick}
            // loading={newsLoading}
            // error={newsError}
          />
        );
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