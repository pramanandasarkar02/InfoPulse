import { useState, useEffect } from 'react';
import axios from 'axios';

// Define the User type to match the backend's user object
export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

// Define the AuthState type
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = 'infopulse_auth';
const TOKEN_KEY = 'infopulse_token';
const REFRESH_TOKEN_KEY = 'infopulse_refresh_token';
const USER_ID_KEY = 'infopulse_user_id'; // New key for user ID

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      const userId = localStorage.getItem(USER_ID_KEY);
      console.log('Initializing auth state:', { storedUser, token, userId });
      return {
        user: storedUser ? JSON.parse(storedUser) : null,
        isAuthenticated: !!token && !!userId,
        isLoading: true,
      };
    } catch (error) {
      console.error('Error initializing auth from localStorage:', error);
      return {
        user: null,
        isAuthenticated: false,
        isLoading: true,
      };
    }
  });

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const userId = localStorage.getItem(USER_ID_KEY);

      if (!token || !userId) {
        console.log('No token or user ID found in localStorage');
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      console.log('Validating token:', token);
      try {
        const response = await axios.get('http://localhost:3003/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data.user;
        console.log('Token validation successful, user:', user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(USER_ID_KEY, user.id); // Ensure user ID is stored
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error: any) {
        console.error('Token validation failed:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        if (error.response?.status === 403 && refreshToken) {
          console.log('Attempting to refresh token');
          try {
            const refreshResponse = await axios.post('http://localhost:3003/api/refresh-token', {
              refreshToken,
            });
            const { token: newToken, user } = refreshResponse.data;
            console.log('Token refresh successful:', { user, newToken });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            localStorage.setItem(TOKEN_KEY, newToken);
            localStorage.setItem(USER_ID_KEY, user.id); // Store user ID
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (refreshError: any) {
            console.error('Refresh token failed:', {
              message: refreshError.message,
              status: refreshError.response?.status,
              data: refreshError.response?.data,
            });
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(USER_ID_KEY);
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_ID_KEY);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    };

    validateToken();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { username });
      const response = await axios.post('http://localhost:3003/api/login', { username, password });
      const { user, token, refreshToken } = response.data;
      console.log('Login successful:', { user, token });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_ID_KEY, user.id); // Store user ID
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
      }

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      console.error('Login error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting registration with:', { username, email });
      const response = await axios.post('http://localhost:3003/api/register', {
        username,
        email,
        password,
      });
      const { user, token, refreshToken } = response.data;
      console.log('Registration successful:', { user, token });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_ID_KEY, user.id); // Store user ID
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
      }

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      console.error('Registration error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return false;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY); // Remove user ID
      console.log('Logged out, cleared localStorage');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return {
    ...authState,
    login,
    register,
    logout,
  };
};