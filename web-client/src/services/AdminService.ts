// src/services/AdminService.ts
import axios, { AxiosResponse } from 'axios';
import { User } from './AuthService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export interface AdminUser extends User {
  lastLoginAt?: string;
  loginCount?: number;
  articlesCreated?: number;
  articlesProcessed?: number;
}

export interface UpdateUserRoleRequest {
  role: 'user' | 'admin' | 'super_admin';
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive';
}

export interface AdminLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  target?: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  articles: {
    total: number;
    processed: number;
    unprocessed: number;
    duplicates: number;
    publishedToday: number;
    publishedThisWeek: number;
    publishedThisMonth: number;
  };
  processing: {
    totalProcessed: number;
    processingRate: number;
    averageProcessingTime: number;
    errorRate: number;
  };
  system: {
    uptime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage: number;
    diskUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  traffic: {
    requestsToday: number;
    requestsThisWeek: number;
    requestsThisMonth: number;
    uniqueVisitors: number;
    topEndpoints: Array<{
      endpoint: string;
      requests: number;
    }>;
  };
}

export interface ServiceInfo {
  service: string;
  status: 'healthy' | 'unhealthy';
  url: string;
  responseTime?: string;
  error?: string;
}

export interface GatewayMetrics {
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  version: string;
  platform: string;
  timestamp: string;
}

export interface UserFilters {
  role?: 'user' | 'admin' | 'super_admin';
  status?: 'active' | 'inactive';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'username' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface LogFilters {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'action' | 'username';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export default class AdminService {
  // USER MANAGEMENT METHODS

  async getAllUsers(filters?: UserFilters): Promise<ApiResponse<PaginatedResponse<AdminUser>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<AdminUser>> = await axios.get(
        `${API_BASE_URL}/admin/users?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch users' 
      };
    }
  }

  async getUserById(userId: string): Promise<ApiResponse<AdminUser>> {
    try {
      const response: AxiosResponse<AdminUser> = await axios.get(
        `${API_BASE_URL}/admin/users/${userId}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch user' 
      };
    }
  }

  async updateUserRole(userId: string, roleData: UpdateUserRoleRequest): Promise<ApiResponse<AdminUser>> {
    try {
      const response: AxiosResponse<AdminUser> = await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/role`,
        roleData
      );
      return { data: response.data, message: 'User role updated successfully' };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to update user role' 
      };
    }
  }

  async updateUserStatus(userId: string, statusData: UpdateUserStatusRequest): Promise<ApiResponse<AdminUser>> {
    try {
      const response: AxiosResponse<AdminUser> = await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/status`,
        statusData
      );
      return { data: response.data, message: 'User status updated successfully' };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to update user status' 
      };
    }
  }

  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/admin/users/${userId}`
      );
      return { data: response.data, message: 'User deleted successfully' };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to delete user' 
      };
    }
  }

  async searchUsers(query: string, filters?: Omit<UserFilters, 'search'>): Promise<ApiResponse<PaginatedResponse<AdminUser>>> {
    return this.getAllUsers({ ...filters, search: query });
  }

  async getUsersByRole(role: 'user' | 'admin' | 'super_admin', filters?: Omit<UserFilters, 'role'>): Promise<ApiResponse<PaginatedResponse<AdminUser>>> {
    return this.getAllUsers({ ...filters, role });
  }

  async getUsersByStatus(status: 'active' | 'inactive', filters?: Omit<UserFilters, 'status'>): Promise<ApiResponse<PaginatedResponse<AdminUser>>> {
    return this.getAllUsers({ ...filters, status });
  }

  // LOGGING AND AUDIT METHODS

  async getAdminLogs(filters?: LogFilters): Promise<ApiResponse<PaginatedResponse<AdminLog>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<PaginatedResponse<AdminLog>> = await axios.get(
        `${API_BASE_URL}/admin/logs?${params.toString()}`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch admin logs' 
      };
    }
  }

  async getLogsByUser(userId: string, filters?: Omit<LogFilters, 'userId'>): Promise<ApiResponse<PaginatedResponse<AdminLog>>> {
    return this.getAdminLogs({ ...filters, userId });
  }

  async getLogsByAction(action: string, filters?: Omit<LogFilters, 'action'>): Promise<ApiResponse<PaginatedResponse<AdminLog>>> {
    return this.getAdminLogs({ ...filters, action });
  }

  async getRecentLogs(limit: number = 50): Promise<ApiResponse<PaginatedResponse<AdminLog>>> {
    return this.getAdminLogs({
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  // DASHBOARD AND STATISTICS METHODS

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response: AxiosResponse<DashboardStats> = await axios.get(
        `${API_BASE_URL}/admin/stats`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch dashboard statistics' 
      };
    }
  }

  async getUserStats(): Promise<ApiResponse<DashboardStats['users']>> {
    try {
      const statsResult = await this.getDashboardStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch user statistics' };
      }
      
      return { data: statsResult.data.users };
    } catch (error: any) {
      return { error: 'Failed to fetch user statistics' };
    }
  }

  async getArticleStats(): Promise<ApiResponse<DashboardStats['articles']>> {
    try {
      const statsResult = await this.getDashboardStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch article statistics' };
      }
      
      return { data: statsResult.data.articles };
    } catch (error: any) {
      return { error: 'Failed to fetch article statistics' };
    }
  }

  async getSystemStats(): Promise<ApiResponse<DashboardStats['system']>> {
    try {
      const statsResult = await this.getDashboardStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch system statistics' };
      }
      
      return { data: statsResult.data.system };
    } catch (error: any) {
      return { error: 'Failed to fetch system statistics' };
    }
  }

  async getTrafficStats(): Promise<ApiResponse<DashboardStats['traffic']>> {
    try {
      const statsResult = await this.getDashboardStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch traffic statistics' };
      }
      
      return { data: statsResult.data.traffic };
    } catch (error: any) {
      return { error: 'Failed to fetch traffic statistics' };
    }
  }

  // SYSTEM MONITORING METHODS

  async getServicesStatus(): Promise<ApiResponse<{ services: ServiceInfo[]; gateway: any }>> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/gateway/services`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch services status' 
      };
    }
  }

  async getGatewayMetrics(): Promise<ApiResponse<GatewayMetrics>> {
    try {
      const response: AxiosResponse<GatewayMetrics> = await axios.get(
        `${API_BASE_URL}/gateway/metrics`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch gateway metrics' 
      };
    }
  }

  async getHealthStatus(): Promise<ApiResponse<{ gateway: string; services: ServiceInfo[]; overall: string; timestamp: string }>> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/health`
      );
      return { data: response.data };
    } catch (error: any) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch health status' 
      };
    }
  }

  // BATCH OPERATIONS

  async batchUpdateUserStatus(userIds: string[], status: 'active' | 'inactive'): Promise<ApiResponse<{ updated: number; failed: number; errors: string[] }>> {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.updateUserStatus(userId, { status }))
      );

      let updated = 0;
      let failed = 0;
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value.error) {
          updated++;
        } else {
          failed++;
          const error = result.status === 'rejected' 
            ? result.reason.message 
            : result.value.error;
          errors.push(`User ${userIds[index]}: ${error}`);
        }
      });

      return {
        data: { updated, failed, errors },
        message: `Batch update completed: ${updated} updated, ${failed} failed`
      };
    } catch (error: any) {
      return { error: 'Batch update operation failed' };
    }
  }

  async batchDeleteUsers(userIds: string[]): Promise<ApiResponse<{ deleted: number; failed: number; errors: string[] }>> {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.deleteUser(userId))
      );

      let deleted = 0;
      let failed = 0;
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value.error) {
          deleted++;
        } else {
          failed++;
          const error = result.status === 'rejected' 
            ? result.reason.message 
            : result.value.error;
          errors.push(`User ${userIds[index]}: ${error}`);
        }
      });

      return {
        data: { deleted, failed, errors },
        message: `Batch delete completed: ${deleted} deleted, ${failed} failed`
      };
    } catch (error: any) {
      return { error: 'Batch delete operation failed' };
    }
  }

  // UTILITY METHODS

  async getRoleStats(): Promise<ApiResponse<Record<string, number>>> {
    try {
      const usersResult = await this.getUserStats();
      if (usersResult.error || !usersResult.data) {
        return { error: usersResult.error || 'Failed to fetch role statistics' };
      }

      // Calculate role distribution from user stats
      const total = usersResult.data.total;
      const admins = usersResult.data.admins;
      const users = total - admins;

      return {
        data: {
          user: users,
          admin: admins,
          super_admin: 0, // This would need to be provided by the backend
          total: total
        }
      };
    } catch (error: any) {
      return { error: 'Failed to calculate role statistics' };
    }
  }

  async getActiveUsersCount(): Promise<ApiResponse<number>> {
    try {
      const usersResult = await this.getUserStats();
      if (usersResult.error || !usersResult.data) {
        return { error: usersResult.error || 'Failed to fetch active users count' };
      }

      return { data: usersResult.data.active };
    } catch (error: any) {
      return { error: 'Failed to fetch active users count' };
    }
  }

  async getNewUsersThisWeek(): Promise<ApiResponse<number>> {
    try {
      const usersResult = await this.getUserStats();
      if (usersResult.error || !usersResult.data) {
        return { error: usersResult.error || 'Failed to fetch new users count' };
      }

      return { data: usersResult.data.newThisWeek };
    } catch (error: any) {
      return { error: 'Failed to fetch new users count' };
    }
  }

  async getSystemUptime(): Promise<ApiResponse<number>> {
    try {
      const metricsResult = await this.getGatewayMetrics();
      if (metricsResult.error || !metricsResult.data) {
        return { error: metricsResult.error || 'Failed to fetch system uptime' };
      }

      return { data: metricsResult.data.uptime };
    } catch (error: any) {
      return { error: 'Failed to fetch system uptime' };
    }
  }

  async isServiceHealthy(serviceName: string): Promise<ApiResponse<boolean>> {
    try {
      const servicesResult = await this.getServicesStatus();
      if (servicesResult.error || !servicesResult.data) {
        return { error: servicesResult.error || 'Failed to check service health' };
      }

      const service = servicesResult.data.services.find(s => 
        s.service.toLowerCase().includes(serviceName.toLowerCase())
      );

      return { data: service ? service.status === 'healthy' : false };
    } catch (error: any) {
      return { error: 'Failed to check service health' };
    }
  }

  // Helper method to format date for API
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Helper method to get date range filters
  getDateRangeFilters(days: number): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      startDate: this.formatDateForAPI(startDate),
      endDate: this.formatDateForAPI(endDate)
    };
  }

  // Helper method to build query parameters
  buildQueryParams(filters: Record<string, any>): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    return params.toString();
  }

  // Helper method to calculate percentage
  calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // Helper method to format bytes
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to format uptime
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}