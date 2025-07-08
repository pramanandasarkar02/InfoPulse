import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { User } from '../types';

interface Category {
  id: number;
  name: string;
}

interface CategoriesManagementProps {
  user: User;
}

export const CategoriesManagement: React.FC<CategoriesManagementProps> = ({ user }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user.is_admin) return;

    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('infopulse_token');
        const response = await axios.get('http://localhost:3003/api/admin/categories', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(response.data.categories);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load categories');
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user.is_admin]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const token = localStorage.getItem('infopulse_token');
      const response = await axios.post(
        'http://localhost:3003/api/admin/categories',
        { name: newCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories([...categories, response.data.category]);
      setNewCategory('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('infopulse_token');
      await axios.delete(`http://localhost:3003/api/admin/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(categories.filter((c) => c.id !== categoryId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Category Management</h1>
      <form onSubmit={handleAddCategory} className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter new category name"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </form>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {c.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};