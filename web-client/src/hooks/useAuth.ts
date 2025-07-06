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

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for stored token and validate it on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Verify token by fetching user profile
      axios
        .get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(response => {
          const user = response.data.user;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        })
        .catch(() => {
          // Invalid or expired token
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(TOKEN_KEY);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('http://localhost:3003/api/login', { username, password });
      const { user, token } = response.data;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, token);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      console.error('Login error:', error.response?.data?.error || error.message);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('http://localhost:3003/api/register', {
        username,
        email,
        password,
      });
      const { user, token } = response.data;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, token);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data?.error || error.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
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