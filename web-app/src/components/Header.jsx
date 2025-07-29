import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaGlobeAmericas, 
  FaBookmark, 
  FaTachometerAlt, 
  FaUpload, 
  FaUser, 
  FaSignInAlt,
  FaSignOutAlt,
  FaUserPlus,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { authService } from '../services/AuthService';

const Header = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Check authentication status
        const checkAuth = () => {
            setIsAuthenticated(authService.isAuthenticated());
            setUser(authService.getCurrentUser());
        };

        // Initial check
        checkAuth();

        // Listen for auth changes
        const interval = setInterval(checkAuth, 1000);

        return () => clearInterval(interval);
    }, []);

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        setIsProfileDropdownOpen(false);
        navigate('/');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.profile-dropdown')) {
                setIsProfileDropdownOpen(false);
            }
            if (!event.target.closest('.mobile-menu')) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50 transition-all duration-200">
            <div className="max-w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-4">
                        <Link to="/" className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-xl">IP</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    InfoPulse
                                </h1>
                                <p className="text-xs text-gray-500 -mt-1">
                                    Your News Companion
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        <Link
                            to="/"
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isActive('/') 
                                    ? 'bg-blue-50 text-blue-600' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            <FaHome className="h-4 w-4" />
                            <span>Home</span>
                        </Link>
                        
                        <Link
                            to="/explore"
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isActive('/explore') 
                                    ? 'bg-blue-50 text-blue-600' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            <FaGlobeAmericas className="h-4 w-4" />
                            <span>Explore</span>
                        </Link>

                        {/* Authenticated User Links */}
                        {isAuthenticated && (
                            <Link
                                to="/feed"
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isActive('/feed') 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                <FaBookmark className="h-4 w-4" />
                                <span>Feed</span>
                            </Link>
                        )}

                        {/* Admin Links */}
                        {isAuthenticated && authService.isAdmin() && (
                            <>
                                <Link
                                    to="/dashboard"
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive('/dashboard') 
                                            ? 'bg-blue-50 text-blue-600' 
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <FaTachometerAlt className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link
                                    to="/newsupload"
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive('/newsupload') 
                                            ? 'bg-blue-50 text-blue-600' 
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <FaUpload className="h-4 w-4" />
                                    <span>NewsUpload</span>
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-2">
                        {/* Authentication Actions */}
                        {isAuthenticated ? (
                            <div className="relative profile-dropdown">
                                <button
                                    onClick={toggleProfileDropdown}
                                    className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${
                                        isActive('/profile') 
                                            ? 'bg-blue-50 text-blue-600' 
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <FaUser className="h-5 w-5" />
                                    <span className="hidden sm:block text-sm font-medium">
                                        {user?.username || 'User'}
                                    </span>
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        <div className="px-4 py-2 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-900">
                                                {user?.username}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {user?.email}
                                            </p>
                                            {user?.role && (
                                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                    {user.role}
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        >
                                            <FaUser className="inline mr-2" />
                                            Profile Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <FaSignOutAlt className="inline mr-2" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center space-x-2">
                                <Link
                                    to="/login"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
                                >
                                    <FaSignInAlt className="h-4 w-4" />
                                    <span>Login</span>
                                </Link>
                                <Link
                                    to="/signup"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200"
                                >
                                    <FaUserPlus className="h-4 w-4" />
                                    <span>Sign Up</span>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden mobile-menu border-t border-gray-200 py-4">
                        <nav className="flex flex-col space-y-2">
                            <Link
                                to="/"
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isActive('/') 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                                onClick={toggleMobileMenu}
                            >
                                <FaHome className="h-4 w-4" />
                                <span>Home</span>
                            </Link>
                            
                            <Link
                                to="/explore"
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isActive('/explore') 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                                onClick={toggleMobileMenu}
                            >
                                <FaGlobeAmericas className="h-4 w-4" />
                                <span>Explore</span>
                            </Link>

                            {isAuthenticated && (
                                <Link
                                    to="/feed"
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive('/feed') 
                                            ? 'bg-blue-50 text-blue-600' 
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    onClick={toggleMobileMenu}
                                >
                                    <FaBookmark className="h-4 w-4" />
                                    <span>Feed</span>
                                </Link>
                            )}

                            {isAuthenticated && authService.isAdmin() && (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            isActive('/dashboard') 
                                                ? 'bg-blue-50 text-blue-600' 
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        onClick={toggleMobileMenu}
                                    >
                                        <FaTachometerAlt className="h-4 w-4" />
                                        <span>Dashboard</span>
                                    </Link>
                                    <Link
                                        to="/newsupload"
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            isActive('/newsupload') 
                                                ? 'bg-blue-50 text-blue-600' 
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        onClick={toggleMobileMenu}
                                    >
                                        <FaUpload className="h-4 w-4" />
                                        <span>NewsUpload</span>
                                    </Link>
                                </>
                            )}

                            {/* Mobile Auth Actions */}
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/profile"
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            isActive('/profile') 
                                                ? 'bg-blue-50 text-blue-600' 
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        onClick={toggleMobileMenu}
                                    >
                                        <FaUser className="h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            toggleMobileMenu();
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-left"
                                    >
                                        <FaSignOutAlt className="h-4 w-4" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                                        onClick={toggleMobileMenu}
                                    >
                                        <FaSignInAlt className="h-4 w-4" />
                                        <span>Login</span>
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                                        onClick={toggleMobileMenu}
                                    >
                                        <FaUserPlus className="h-4 w-4" />
                                        <span>Sign Up</span>
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;