// =============================================================================
// src/services/AuthService.js
// =============================================================================
import axios from 'axios';
const API_BASE_URL = 'http://localhost:8080';

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
    this.loadFromStorage();
    this.setupAxiosInterceptors();
  }

  loadFromStorage() {
    try {
      this.token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      this.user = userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error loading auth data from storage:', error);
      this.clearStorage();
    }
  }

  saveToStorage(token, user) {
    try {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      this.token = token;
      this.user = user;
    } catch (error) {
      console.error('Error saving auth data to storage:', error);
    }
  }

  clearStorage() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.token = null;
    this.user = null;
  }

  setupAxiosInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        if (this.token && config.url?.startsWith(API_BASE_URL)) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          if (error.response.data?.error?.includes('token') || 
              error.response.data?.error?.includes('expired')) {
            this.logout();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async signup(data) {
    try {
        const requestBody = {
            username: data.username,
            email: data.email,
            password: data.password
        }
      const response = await axios.post(
        `${API_BASE_URL}/auth/signup`,
        requestBody
      );
      
      if (response.data.token && response.data.user) {
        console.log(response.data);
        this.saveToStorage(response.data.token, response.data.user);
      }
      
      
      return { data: response.data, message: response.data.message };
    } catch (error) {
      return { 
        error: error.response?.data?.error || error.message || 'Signup failed' 
      };
    }
  }

  async login(data) {
    try {
      console.log(data);
      const requestBody = {
          email: data.email,
          password: data.password
      }
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        requestBody
      );
      
      if (response.data.token && response.data.user) {
        this.saveToStorage(response.data.token, response.data.user);
      }
      
      return { data: response.data, message: response.data.message };
    } catch (error) {
      return { 
        error: error.response?.data?.error || error.message || 'Login failed' 
      };
    }
  }

  async validateToken() {
    try {
      if (!this.token) {
        return { error: 'No token available' };
      }

      const response = await axios.get(`${API_BASE_URL}/auth/validate`, {
        params: { token: this.token }
      });
      
      if (response.data.user) {
        this.user = response.data.user;
        localStorage.setItem('auth_user', JSON.stringify(this.user));
      }
      
      return { data: { valid: true, user: response.data.user } };
    } catch (error) {
      this.logout();
      return { 
        error: error.response?.data?.error || 'Token validation failed' 
      };
    }
  }

  async getProfile() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/auth/profile`
      );
      
      this.user = response.data;
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch profile' 
      };
    }
  }

  async updateProfile(data) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        data
      );
      
      this.user = response.data;
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      
      return { data: response.data, message: 'Profile updated successfully' };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to update profile' 
      };
    }
  }

  async changePassword(data) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/auth/change-password`,
        data
      );
      
      return { data: response.data, message: 'Password changed successfully' };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to change password' 
      };
    }
  }

  logout() {
    this.clearStorage();
  }

  // Utility methods
  isAuthenticated() {
    return !!(this.token && this.user);
  }

  getCurrentUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  hasRole(role) {
    return this.user?.role === role;
  }

  isAdmin() {
    return this.user?.role === 'admin' || this.user?.role === 'super_admin';
  }

  isSuperAdmin() {
    return this.user?.role === 'super_admin';
  }

  getUserId() {
    return this.user?.userId || null;
  }

  getUsername() {
    return this.user?.username || null;
  }

  // Auto-refresh token (call this periodically)
  async refreshAuth() {
    try {
      const result = await this.validateToken();
      return !result.error;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export { authService };