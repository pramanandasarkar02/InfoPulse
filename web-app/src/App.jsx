import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/AuthService';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Feed from './pages/Feed';
import DashBoard from './pages/DashBoard';
import NewsUpload from './pages/NewsUpload';
import Profile from './pages/Profile';
import ArticleDetails from './pages/ArticleDetails';

import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import SignUp from './components/SignUp';

// Protected Route Component for authenticated users
const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        // Validate token with server
        const result = await authService.validateToken();
        setIsAuthenticated(!result.error);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Route Component for admin users
const AdminRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        // Validate token with server
        const result = await authService.validateToken();
        if (!result.error && authService.isAdmin()) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
};

// Public Route Component (redirects to home if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    // Initialize app and check authentication status
    const initializeApp = async () => {
      try {
        // Auto-refresh authentication if token exists
        if (authService.isAuthenticated()) {
          await authService.refreshAuth();
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsAppLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isAppLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading InfoPulse...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <>
            <Home />
            <Footer />
          </>
        } />
        
        <Route path="/explore" element={
          <>
            <Header />
            <Explore />
            <Footer />
          </>
        } />
        
        <Route path="/article/:title" element={
          <>
            <Header />
            <ArticleDetails />
            <Footer />
          </>
        } />

        {/* Auth Routes (redirect to home if already logged in) */}
        <Route path="/login" element={
          <PublicRoute>
            
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/signup" element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        } />

        {/* Protected Routes (require authentication) */}
        <Route path="/feed" element={
          <ProtectedRoute>
            <Header />
            <Feed />
            <Footer />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Header />
            <Profile />
            <Footer />
          </ProtectedRoute>
        } />

        {/* Admin Routes (require admin privileges) */}
        <Route path="/dashboard" element={
          <AdminRoute>
            <Header />
            <DashBoard />
            <Footer />
          </AdminRoute>
        } />
        
        <Route path="/newsupload" element={
          <AdminRoute>
            <Header />
            <NewsUpload />
            <Footer />
          </AdminRoute>
        } />

        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;