import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const NEWSAPI_KEY = process.env.NEWSAPI;
const MONGODB_URI = process.env.MONGODB_URI;

const NEWS_PROCESSING_SERVICE_URL = process.env.NEWS_PROCESSING_SERVICE_URL || 'http://localhost:3002';

if (!NEWSAPI_KEY || !MONGODB_URI) {
  console.error('Missing required environment variables: NEWSAPI_KEY or MONGODB_URI');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// MongoDB connection
const client = new MongoClient(MONGODB_URI);
const database = client.db('news-db');
const collection = database.collection('news');

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Create index on title for better performance when checking duplicates
    await collection.createIndex({ title: 1 });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ createdAt: -1 });
    console.log('Database indexes created');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// request news processing api to process this article
const processArticle = async (article) => {
  try {
    const response = await axios.post(`${NEWS_PROCESSING_SERVICE_URL}/api/process-article`, article);
    return response.data;
  } catch (error) {
    console.error('Error processing article:', error);
    throw error;
  }
}


// Function to fetch and save news for 20 categories
const fetchAndSaveNews = async () => {
  try {
    const categories = [
      { name: 'business', type: 'category' },
      { name: 'entertainment', type: 'category' },
      { name: 'general', type: 'category' },
      { name: 'health', type: 'category' },
      { name: 'science', type: 'category' },
      { name: 'sports', type: 'category' },
      { name: 'technology', type: 'category' },
      { name: 'politics', type: 'keyword', query: 'politics' },
      { name: 'environment', type: 'keyword', query: 'environment' },
      { name: 'education', type: 'keyword', query: 'education' },
      { name: 'crime', type: 'keyword', query: 'crime' },
      { name: 'economy', type: 'keyword', query: 'economy' },
      { name: 'culture', type: 'keyword', query: 'culture' },
      { name: 'travel', type: 'keyword', query: 'travel' },
      { name: 'fashion', type: 'keyword', query: 'fashion' },
      { name: 'food', type: 'keyword', query: 'food' },
      { name: 'automotive', type: 'keyword', query: 'automotive' },
      { name: 'gaming', type: 'keyword', query: 'gaming' },
      { name: 'space', type: 'keyword', query: 'space exploration' },
      { name: 'weather', type: 'keyword', query: 'weather' },
    ];

    for (const cat of categories) {
      const endpoint =
        cat.type === 'category'
          ? `https://newsapi.org/v2/top-headlines?category=${cat.name}&apiKey=${NEWSAPI_KEY}`
          : `https://newsapi.org/v2/everything?q=${encodeURIComponent(cat.query)}&apiKey=${NEWSAPI_KEY}`;

      try {
        const response = await axios.get(endpoint);
        const articles = response.data.articles || [];

        for (const article of articles) {
          // Skip articles without title or URL
          if (!article.url || !article.title || article.title.trim() === '') {
            continue;
          }

          // Check if an article with the same title already exists
          const existingArticle = await collection.findOne({ 
            title: article.title.trim() 
          });

          if (existingArticle) {
            console.log(`Skipping duplicate title: "${article.title}"`);
            continue; // Skip this article as it already exists
          }
          
          const articleId = article.url;
          const articleData = {
            _id: articleId,
            source: article.source || {},
            author: article.author || null,
            title: article.title.trim(),
            description: article.description || null,
            url: article.url,
            urlToImage: article.urlToImage || null,
            publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
            content: article.content || null,
            category: cat.name,
            createdAt: new Date(),
          };

          try {
            // Insert new article (will throw error if _id already exists)
            await collection.insertOne(articleData);
            console.log(`New article saved: "${article.title}"`);

            // Process the article
            const processedArticle = await processArticle(articleData);
            console.log(`Processed article: "${article.title}"`);

          } catch (error) {
            // Handle duplicate _id error (same URL)
            if (error.code === 11000) {
              console.log(`Skipping duplicate URL: ${articleId}`);
            } else {
              console.error('Error inserting article:', error.message);
            }
          }
        }
        console.log(`News for ${cat.name} fetched and processed`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
      } catch (error) {
        console.error(`Error fetching ${cat.name}:`, error.message);
      }
    }
    console.log('All news categories fetched and processed successfully');
  } catch (error) {
    console.error('Error in fetchAndSaveNews:', error.message);
  }
};

// Run fetchAndSaveNews immediately and then every 10 minutes
const startNewsFetching = () => {
  fetchAndSaveNews();
  setInterval(fetchAndSaveNews, 10 * 60 * 1000);
};

// API Endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'News API Server',
    endpoints: {
      'GET /': 'Get API information',
      'GET /categories': 'Get all categories',
      'GET /articles': 'Get all articles (query: ?category=name&limit=50)',
      'POST /articles': 'Add new article',
      'GET /articles/:category': 'Get articles by category',
      'GET /stats': 'Get database statistics'
    }
  });
});

// Get all categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await collection.distinct('category');
    const formattedCategories = categories.sort().map((cat, index) => ({
      id: index + 1,
      name: cat
    }));
    res.json({ categories: formattedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all articles with optional category filter
app.get('/articles', async (req, res) => {
  try {
    const { category, limit = 300 } = req.query;
    
    // Build query filter
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Get articles from MongoDB
    const articles = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .toArray();
      
    res.json({ 
      articles,
      count: articles.length,
      category: category || 'all'
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// post an article
app.post('/articles', async (req, res) => {
  try {
    const article = req.body;
    await collection.insertOne(article);
    await processArticle(article);
    res.status(201).json({ message: 'Article saved successfully' });
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get articles by specific category
app.get('/articles/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;
    
    const articles = await collection
      .find({ category })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .toArray();
      
    res.json({ 
      articles, 
      category,
      count: articles.length
    });
  } catch (error) {
    console.error('Error fetching articles by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get database statistics
app.get('/stats', async (req, res) => {
  try {
    const totalArticles = await collection.countDocuments();
    
    const categoryCounts = await collection.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    const recentArticles = await collection.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const oldestArticle = await collection.findOne({}, { sort: { createdAt: 1 } });
    const newestArticle = await collection.findOne({}, { sort: { createdAt: -1 } });
    
    res.json({
      totalArticles,
      categoryCounts,
      recentArticles,
      oldestArticle: oldestArticle ? oldestArticle.createdAt : null,
      newestArticle: newestArticle ? newestArticle.createdAt : null
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server and MongoDB connection
const startServer = async () => {
  try {
    await connectToMongoDB();
    // startNewsFetching(); // automatic news fetching
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`API Documentation available at http://localhost:${port}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing MongoDB connection...');
  await client.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing MongoDB connection...');
  await client.close();
  process.exit(0);
});