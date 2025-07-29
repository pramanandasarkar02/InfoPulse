import React, { useState } from 'react';
import newsService from '../services/NewsService';

const NewsUpload = () => {
  const [article, setArticle] = useState({
    author: 'Sheri McWhirter | smcwhirter@mlive.com, Garret Ellison | gellison@mlive.com',
    title: 'Michigan is attempting something never done before in America’s nuclear industry and contructions - MLive.com',
    content: 'COVERT, MI Federal regulators are poised to approve a restart of the Palisades Nuclear Plant, putting Michigan at the heart of a national nuclear energy renaissance.\r\nNuclear power has emerged as a k… [+5596 chars]',
    createdAt: '2025-07-27T02:08:48.881Z',
    description: 'Michigan is navigating a shift in its energy landscape as Palisades nuclear plant is poised to restart.',
    source: { id: null, name: 'mlive.com' },
    publishedAt: '2025-07-25T15:19:00.000Z',
    category: 'business',
    tags: '',
    url: 'https://www.mlive.com/environment/2025/07/michigan-is-attempting-something-never-done-before-in-americas-nuclear-industry.html',
    urlToImage: 'https://www.mlive.com/resizer/v2/7NTSYQLC5RBM7BUUWQKC3HIXWQ.jpg?auth=d04f16669fb571388595ccbe6ed1b133cab6b22d516c909872b3ab978f2b9258&width=1280&quality=90'
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'source.name') {
      setArticle(prev => ({
        ...prev,
        source: { ...prev.source, name: value }
      }));
    } else {
      setArticle(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await newsService.createArticle(article);
      if (response.error) {
        setMessage(response.error);
      } else {
        setMessage(response.message);
      }
    } catch (error) {
      setMessage('Error submitting article');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Upload News Article</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Author</label>
          <input
            type="text"
            name="author"
            value={article.author}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={article.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Content</label>
          <textarea
            name="content"
            value={article.content}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="6"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={article.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Source Name</label>
          <input
            type="text"
            name="source.name"
            value={article.source.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <input
            type="text"
            name="category"
            value={article.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tags</label>
          <input
            type="text"
            name="tags"
            value={article.tags}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Comma-separated tags"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">URL</label>
          <input
            type="url"
            name="url"
            value={article.url}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Image URL</label>
          <input
            type="url"
            name="urlToImage"
            value={article.urlToImage}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Created At</label>
          <input
            type="datetime-local"
            name="createdAt"
            value={article.createdAt.slice(0, 16)}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Published At</label>
          <input
            type="datetime-local"
            name="publishedAt"
            value={article.publishedAt.slice(0, 16)}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Submit Article
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
};

export default NewsUpload;