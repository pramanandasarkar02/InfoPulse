// src/services/index.ts
export { default as authService } from './AuthService';
export { default as newsService } from './NewsService';
export { default as adminService } from './AdminService';

// Re-export types for easier imports
export type {
  User,
  LoginRequest,
  SignupRequest,
  LoginResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from './AuthService';

export type {
  NewsArticle,
  NewsCategory,
  NewsStats,
  ProcessingStats,
  DuplicateArticle,
  ArticleFilters,
  CreateArticleRequest,
  PaginatedResponse,
} from './NewsService';

export type {
  AdminUser,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  AdminLog,
  DashboardStats,
  ServiceInfo,
  GatewayMetrics,
  UserFilters,
  LogFilters,
} from './AdminService';

// Common API Response type
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}