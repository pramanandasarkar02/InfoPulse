import React, { useState, useEffect } from 'react';
import { FaUser, FaNewspaper, FaChartBar, FaBars, FaTrash, FaEdit, FaPlus } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import newsService from '../services/NewsService';
import { adminService } from '../services/AdminService';
import axios from 'axios';

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState('user');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (currentPage === 'articles') {
          const response = await newsService.getArticles();
          
          const articleData = response.data.articles.map(article => ({
            id: article._id,
            title: article.title,
            author: article.author,
            source: article.source.name,
            date: new Date(article.publishedAt).toLocaleDateString(),
            category: article.category || 'Uncategorized'
          }));
          setArticles(articleData);
        } 
        else if (currentPage === 'categories') {
          const response = await newsService.getCategories();
          setCategories(response.data.categories);
        }
        else if (currentPage === 'stats') {
          
          const getStats = await newsService.getStats();
          console.log(getStats.data)
          const mockStats = [
            { name: 'Total Articles', value: getStats.data.totalArticles },
            { name: 'Active Users', value: getStats.data.totalUser },
            { name: 'Categories', value: getStats.data.totalCategory },

          ];
          setStatistics(mockStats);
        }
        else if (currentPage === 'user') {
          const response = await axios.get('http://localhost:8080/users/all');
        console.log(response)
          console.log(response)
          setUsers(response.data.users);
        }
        
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const handleDeleteArticle = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await newsService.deleteArticle(id);
        setArticles(articles.filter(article => article.id !== id));
      } catch (err) {
        setError('Failed to delete article');
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await newsService.deleteCategory(id);
        setCategories(categories.filter(category => category.id !== id));
      } catch (err) {
        setError('Failed to delete category');
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg"
      >
        {sidebarOpen ? <MdClose size={24} /> : <FaBars size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                      md:translate-x-0 transform transition-transform duration-200 ease-in-out
                      fixed md:static inset-y-0 left-0 w-64 bg-white shadow-lg z-40`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-8 flex items-center">
            <FaChartBar className="mr-2 text-blue-500" />
            Admin Dashboard
          </h1>
          
          <nav className="space-y-2">
            <button
              onClick={() => setCurrentPage('user')}
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${currentPage === 'user' 
                ? 'bg-blue-100 text-blue-600 font-medium' 
                : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <FaUser className={`mr-3 ${currentPage === 'user' ? 'text-blue-500' : 'text-gray-500'}`} />
              Users
            </button>
            
            <button
              onClick={() => setCurrentPage('articles')}
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${currentPage === 'articles' 
                ? 'bg-blue-100 text-blue-600 font-medium' 
                : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <FaNewspaper className={`mr-3 ${currentPage === 'articles' ? 'text-blue-500' : 'text-gray-500'}`} />
              Articles
            </button>
            
            <button
              onClick={() => setCurrentPage('categories')}
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${currentPage === 'categories' 
                ? 'bg-blue-100 text-blue-600 font-medium' 
                : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <FaChartBar className={`mr-3 ${currentPage === 'categories' ? 'text-blue-500' : 'text-gray-500'}`} />
              Categories
            </button>
            
            <button
              onClick={() => setCurrentPage('stats')}
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${currentPage === 'stats' 
                ? 'bg-blue-100 text-blue-600 font-medium' 
                : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <FaChartBar className={`mr-3 ${currentPage === 'stats' ? 'text-blue-500' : 'text-gray-500'}`} />
              Statistics
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-x-auto max-h-screen">
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {currentPage === 'user' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">User Management</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 
                                  user.role === 'Editor' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-green-100 text-green-800'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                <FaEdit />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {currentPage === 'articles' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Article Management</h2>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
                      <FaPlus className="mr-2" /> Add Article
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {articles.map(article => (
                          <tr key={article.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{article.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{article.author || 'Unknown'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{article.source}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {article.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {article.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                <FaEdit />
                              </button>
                              <button 
                                onClick={() => handleDeleteArticle(article.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {currentPage === 'categories' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Category Management</h2>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
                      <FaPlus className="mr-2" /> Add Category
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(category => (
                      <div key={category.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-lg">{category.name}</h3>
                          <p className="text-gray-500 text-sm">{category.description || 'No description'}</p>
                        </div>
                        <div>
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentPage === 'stats' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statistics.map((stat, index) => (
                      <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
                        <h3 className="text-gray-500 text-sm font-medium">{stat.name}</h3>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4 py-2">
                        <p className="text-sm">5 new articles added today</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4 py-2">
                        <p className="text-sm">User registration increased by 12%</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4 py-2">
                        <p className="text-sm">New category "Technology" created</p>
                        <p className="text-xs text-gray-500">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;