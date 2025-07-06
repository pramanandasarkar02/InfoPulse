
import React, { useState, useEffect } from 'react';
import { Loader2, Newspaper, Users, Upload } from 'lucide-react';
import axios from 'axios';
import { User, CurrentPage } from '../types';

interface AdminDashboardProps {
  user: User;
  onPageChange: (page: CurrentPage) => void;
}

interface AdminStats {
  totalArticles: number;
  totalUsers: number;
  activeCategories: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onPageChange }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user.is_admin) return;

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('infopulse_token');
        const response = await axios.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load admin stats');
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.is_admin]);

  if (!user.is_admin) {
    return <div className="p-6 text-red-600">Access denied: Admin privileges required</div>;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Newspaper className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Articles</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.totalArticles || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Newspaper className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Categories</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.activeCategories || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <button
          onClick={() => onPageChange('upload')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Upload className="h-5 w-5" />
          <span>Upload New Article</span>
        </button>
      </div>
    </div>
  );
};
