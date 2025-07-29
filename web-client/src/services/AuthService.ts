// src/services/AuthService.ts
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:8080';

export interface User {
  userId: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.loadFromStorage();
    this.setupAxiosInterceptors();
  }

  private loadFromStorage(): void {
    try {
      this.token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      this.user = userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error loading auth data from storage:', error);
      this.clearStorage();
    }
  }

  private saveToStorage(token: string, user: User): void {
    try {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      this.token = token;
      this.user = user;
    } catch (error) {
      console.error('Error saving auth data to storage:', error);
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.token = null;
    this.user = null;
  }

  private setupAxiosInterceptors(): void {
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
  async signup(data: SignupRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response: AxiosResponse<LoginResponse> = await axios.post(
        `${API_BASE_URL}/auth/signup`,
        data
      );
      
      if (response.data.token && response.data.user) {
        this.saveToStorage(response.data.token, response.data.user);
      }
      
      return { data: response.data, message: response.data.message };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || error.message || 'Signup failed' 
      };
    }
  }

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response: AxiosResponse<LoginResponse> = await axios.post(
        `${API_BASE_URL}/auth/login`,
        data
      );
      
      if (response.data.token && response.data.user) {
        this.saveToStorage(response.data.token, response.data.user);
      }
      
      return { data: response.data, message: response.data.message };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || error.message || 'Login failed' 
      };
    }
  }

  async validateToken(): Promise<ApiResponse<{ valid: boolean; user?: User }>> {
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
    } catch (error: any) {
      this.logout();
      return { 
        error: error.response?.data?.error || 'Token validation failed' 
      };
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<User> = await axios.get(
        `${API_BASE_URL}/auth/profile`
      );
      
      this.user = response.data;
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch profile' 
      };
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<User> = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        data
      );
      
      this.user = response.data;
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      
      return { data: response.data, message: 'Profile updated successfully' };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to update profile' 
      };
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/auth/change-password`,
        data
      );
      
      return { data: response.data, message: 'Password changed successfully' };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to change password' 
      };
    }
  }

  logout(): void {
    this.clearStorage();
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin' || this.user?.role === 'super_admin';
  }

  isSuperAdmin(): boolean {
    return this.user?.role === 'super_admin';
  }

  getUserId(): string | null {
    return this.user?.userId || null;
  }

  getUsername(): string | null {
    return this.user?.username || null;
  }

  // Auto-refresh token (call this periodically)
  async refreshAuth(): Promise<boolean> {
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

export default authService;