

const ADMIN_API_BASE_URL = 'http://localhost:8080';

class AdminService {
  // USER MANAGEMENT METHODS

  async getAllUsers(filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${ADMIN_API_BASE_URL}/admin/users?${params.toString()}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch users' 
      };
    }
  }
  async getUsers(){
    try {
        
      const response = await axios.get(
        "http://localhost:8080/users/all"
        
      );
      console.log(response)
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error  
      };
    }
  }

  async getUserById(userId) {
    try {
      const response = await axios.get(
        `${ADMIN_API_BASE_URL}/admin/users/${userId}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch user' 
      };
    }
  }

  async updateUserRole(userId, roleData) {
    try {
      const response = await axios.put(
        `${ADMIN_API_BASE_URL}/admin/users/${userId}/role`,
        roleData
      );
      return { data: response.data, message: 'User role updated successfully' };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to update user role' 
      };
    }
  }

  async updateUserStatus(userId, statusData) {
    try {
      const response = await axios.put(
        `${ADMIN_API_BASE_URL}/admin/users/${userId}/status`,
        statusData
      );
      return { data: response.data, message: 'User status updated successfully' };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to update user status' 
      };
    }
  }

  async deleteUser(userId) {
    try {
      const response = await axios.delete(
        `${ADMIN_API_BASE_URL}/admin/users/${userId}`
      );
      return { data: response.data, message: 'User deleted successfully' };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to delete user' 
      };
    }
  }

  async searchUsers(query, filters) {
    return this.getAllUsers({ ...filters, search: query });
  }

  async getUsersByRole(role, filters) {
    return this.getAllUsers({ ...filters, role });
  }

  async getUsersByStatus(status, filters) {
    return this.getAllUsers({ ...filters, status });
  }

  // LOGGING AND AUDIT METHODS

  async getAdminLogs(filters) {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(
        `${ADMIN_API_BASE_URL}/admin/logs?${params.toString()}`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch admin logs' 
      };
    }
  }

  async getLogsByUser(userId, filters) {
    return this.getAdminLogs({ ...filters, userId });
  }

  async getLogsByAction(action, filters) {
    return this.getAdminLogs({ ...filters, action });
  }

  async getRecentLogs(limit = 50) {
    return this.getAdminLogs({
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  // DASHBOARD AND STATISTICS METHODS

  async getDashboardStats() {
    try {
      const response = await axios.get(
        `${ADMIN_API_BASE_URL}/admin/stats`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch dashboard statistics' 
      };
    }
  }

  async getUserStats() {
    try {
      const statsResult = await this.getDashboardStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch user statistics' };
      }
      
      return { data: statsResult.data.users };
    } catch (error) {
      return { error: 'Failed to fetch user statistics' };
    }
  }

  async getArticleStats() {
    try {
      const statsResult = await this.getDashboardStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch article statistics' };
      }
      
      return { data: statsResult.data.articles };
    } catch (error) {
      return { error: 'Failed to fetch article statistics' };
    }
  }

  async getSystemStats() {
    try {
      const statsResult = await this.getDashboardStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch system statistics' };
      }
      
      return { data: statsResult.data.system };
    } catch (error) {
      return { error: 'Failed to fetch system statistics' };
    }
  }

  async getTrafficStats() {
    try {
      const statsResult = await this.getDashboardStats();
      if (statsResult.error || !statsResult.data) {
        return { error: statsResult.error || 'Failed to fetch traffic statistics' };
      }
      
      return { data: statsResult.data.traffic };
    } catch (error) {
      return { error: 'Failed to fetch traffic statistics' };
    }
  }

  // SYSTEM MONITORING METHODS

  async getServicesStatus() {
    try {
      const response = await axios.get(
        `${ADMIN_API_BASE_URL}/gateway/services`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch services status' 
      };
    }
  }

  async getGatewayMetrics() {
    try {
      const response = await axios.get(
        `${ADMIN_API_BASE_URL}/gateway/metrics`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch gateway metrics' 
      };
    }
  }

  async getHealthStatus() {
    try {
      const response = await axios.get(
        `${ADMIN_API_BASE_URL}/health`
      );
      return { data: response.data };
    } catch (error) {
      return { 
        error: error.response?.data?.error || 'Failed to fetch health status' 
      };
    }
  }

  // BATCH OPERATIONS

  async batchUpdateUserStatus(userIds, status) {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.updateUserStatus(userId, { status }))
      );

      let updated = 0;
      let failed = 0;
      const errors = [];

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
    } catch (error) {
      return { error: 'Batch update operation failed' };
    }
  }

  async batchDeleteUsers(userIds) {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.deleteUser(userId))
      );

      let deleted = 0;
      let failed = 0;
      const errors = [];

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
    } catch (error) {
      return { error: 'Batch delete operation failed' };
    }
  }

  // UTILITY METHODS

  async getRoleStats() {
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
    } catch (error) {
      return { error: 'Failed to calculate role statistics' };
    }
  }

  async getActiveUsersCount() {
    try {
      const usersResult = await this.getUserStats();
      if (usersResult.error || !usersResult.data) {
        return { error: usersResult.error || 'Failed to fetch active users count' };
      }

      return { data: usersResult.data.active };
    } catch (error) {
      return { error: 'Failed to fetch active users count' };
    }
  }

  async getNewUsersThisWeek() {
    try {
      const usersResult = await this.getUserStats();
      if (usersResult.error || !usersResult.data) {
        return { error: usersResult.error || 'Failed to fetch new users count' };
      }

      return { data: usersResult.data.newThisWeek };
    } catch (error) {
      return { error: 'Failed to fetch new users count' };
    }
  }

  async getSystemUptime() {
    try {
      const metricsResult = await this.getGatewayMetrics();
      if (metricsResult.error || !metricsResult.data) {
        return { error: metricsResult.error || 'Failed to fetch system uptime' };
      }

      return { data: metricsResult.data.uptime };
    } catch (error) {
      return { error: 'Failed to fetch system uptime' };
    }
  }

  async isServiceHealthy(serviceName) {
    try {
      const servicesResult = await this.getServicesStatus();
      if (servicesResult.error || !servicesResult.data) {
        return { error: servicesResult.error || 'Failed to check service health' };
      }

      const service = servicesResult.data.services.find(s => 
        s.service.toLowerCase().includes(serviceName.toLowerCase())
      );

      return { data: service ? service.status === 'healthy' : false };
    } catch (error) {
      return { error: 'Failed to check service health' };
    }
  }

  // Helper method to format date for API
  formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
  }

  // Helper method to get date range filters
  getDateRangeFilters(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      startDate: this.formatDateForAPI(startDate),
      endDate: this.formatDateForAPI(endDate)
    };
  }

  // Helper method to build query parameters
  buildQueryParams(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    return params.toString();
  }

  // Helper method to calculate percentage
  calculatePercentage(value, total) {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // Helper method to format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to format uptime
  formatUptime(seconds) {
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

// Create singleton instance
const adminService = new AdminService();

export { adminService };