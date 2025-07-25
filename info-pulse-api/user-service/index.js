const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';

// Middleware
app.use(cors({
  credentials: true,
}));
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'pguser',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'user-db',
  password: process.env.DB_PASSWORD || 'S3cret',
  port: process.env.DB_PORT || 5432,
});

// Default users to create
const DEFAULT_USERS = [
  { username: 'admin', email: 'admin@example.com', password: 'admin123', is_admin: true },
  { username: 'john_doe', email: 'john@example.com', password: 'password123', is_admin: false },
  { username: 'jane_smith', email: 'jane@example.com', password: 'password123', is_admin: false },
  { username: 'mike_wilson', email: 'mike@example.com', password: 'password123', is_admin: false },
  { username: 'sarah_jones', email: 'sarah@example.com', password: 'password123', is_admin: false },
  { username: 'david_brown', email: 'david@example.com', password: 'password123', is_admin: false },
  { username: 'lisa_davis', email: 'lisa@example.com', password: 'password123', is_admin: false },
  { username: 'robert_miller', email: 'robert@example.com', password: 'password123', is_admin: false },
  { username: 'emily_taylor', email: 'emily@example.com', password: 'password123', is_admin: false },
  { username: 'james_anderson', email: 'james@example.com', password: 'password123', is_admin: false },
];

// Default news categories
const DEFAULT_CATEGORIES = [
  'Politics', 'Technology', 'Sports', 'Entertainment', 'Business',
  'Health', 'Science', 'World News', 'Local News', 'Weather',
  'Education', 'Travel', 'Food', 'Fashion', 'Automotive',
  'Real Estate', 'Finance', 'Gaming', 'Music', 'Movies',
];

// Function to get and save news articles
const getAllNewsArticles = async () => {
  try {
    console.log('Fetching news articles from external API...');
    const response = await axios.get('http://localhost:3002/articles');
    const newsArticles = response.data;

    if (!newsArticles || !Array.isArray(newsArticles)) {
      console.log('No articles found or invalid response format');
      return;
    }

    console.log(`Found ${newsArticles.length} articles to process`);

    // Get the default category (Politics) for articles without specific category
    const defaultCategoryResult = await pool.query(
      'SELECT id FROM news_categories WHERE name = $1',
      ['Politics']
    );
    const defaultCategoryId = defaultCategoryResult.rows[0]?.id;

    // Get admin user as default author
    const adminUserResult = await pool.query(
      'SELECT id FROM users WHERE is_admin = true LIMIT 1'
    );
    const defaultAuthorId = adminUserResult.rows[0]?.id;

    let savedCount = 0;
    let skippedCount = 0;

    for (const article of newsArticles) {
      try {
        // Check if article with same title already exists
        const existingArticle = await pool.query(
          'SELECT id FROM news_articles WHERE title = $1',
          [article.title]
        );

        if (existingArticle.rows.length > 0) {
          console.log(`Article already exists: ${article.title}`);
          skippedCount++;
          continue;
        }

        // Determine category based on topics/keywords
        let categoryId = defaultCategoryId;
        if (article.topics && article.topics.length > 0) {
          const topicName = article.topics[0];
          const categoryResult = await pool.query(
            'SELECT id FROM news_categories WHERE LOWER(name) = LOWER($1)',
            [topicName]
          );
          if (categoryResult.rows.length > 0) {
            categoryId = categoryResult.rows[0].id;
          }
        }

        // Insert article into database
        await pool.query(
          `INSERT INTO news_articles (title, content, category_id, author_id, published_at, image_url, keywords, topics)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            article.title || 'Untitled',
            article.content || article.description || 'No content available',
            categoryId,
            defaultAuthorId,
            article.insertion_date ? new Date(article.insertion_date) : new Date(),
            article.url || article.image_url || null,
            JSON.stringify(article.keywords || []),
            JSON.stringify(article.topics || [])
          ]
        );

        savedCount++;
        console.log(`Saved article: ${article.title}`);
      } catch (articleError) {
        console.error(`Error saving article "${article.title}":`, articleError.message);
      }
    }

    console.log(`News articles processing complete. Saved: ${savedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Error fetching/saving news articles:', error.message);
  }
};

// Initialize database
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create news_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create news_articles table with additional fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news_articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT,
        category_id INTEGER REFERENCES news_categories(id) ON DELETE SET NULL,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        published_at TIMESTAMP NOT NULL,
        image_url TEXT,
        keywords JSONB,
        topics JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_title UNIQUE (title)
      )
    `);

    // Verify keywords and topics columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'news_articles' AND column_name IN ('keywords', 'topics')
    `);
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    
    if (!existingColumns.includes('keywords')) {
      console.log('Adding missing keywords column to news_articles...');
      await pool.query('ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS keywords JSONB');
      await pool.query('UPDATE news_articles SET keywords = \'[]\'::JSONB WHERE keywords IS NULL');
    }
    
    if (!existingColumns.includes('topics')) {
      console.log('Adding missing topics column to news_articles...');
      await pool.query('ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS topics JSONB');
      await pool.query('UPDATE news_articles SET topics = \'[]\'::JSONB WHERE topics IS NULL');
    }

    // Create user_topics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_topics (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES news_categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category_id)
      )
    `);

    // Create refresh_tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default categories
    console.log('Inserting default categories...');
    for (const category of DEFAULT_CATEGORIES) {
      await pool.query(
        'INSERT INTO news_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [category]
      );
    }

    // Insert default users
    console.log('Creating default users...');
    for (const user of DEFAULT_USERS) {
      try {
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE username = $1 OR email = $2',
          [user.username, user.email]
        );

        if (existingUser.rows.length === 0) {
          const hashedPassword = await bcrypt.hash(user.password, 10);
          const result = await pool.query(
            'INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id',
            [user.username, user.email, hashedPassword, user.is_admin]
          );

          const newUserId = result.rows[0].id;

          if (!user.is_admin) {
            const defaultCategories = await pool.query(
              'SELECT id FROM news_categories ORDER BY id LIMIT 5'
            );
            for (const category of defaultCategories.rows) {
              await pool.query(
                'INSERT INTO user_topics (user_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [newUserId, category.id]
              );
            }
          }

          console.log(`Created user: ${user.username} (${user.is_admin ? 'admin' : 'regular'})`);
        } else {
          console.log(`User ${user.username} already exists, skipping...`);
        }
      } catch (userError) {
        console.error(`Error creating user ${user.username}:`, userError.message);
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, is_admin = false } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_admin, created_at',
      [username, email, hashedPassword, is_admin]
    );

    const newUser = result.rows[0];

    const defaultCategories = await pool.query(
      'SELECT id FROM news_categories ORDER BY id LIMIT 5'
    );
    for (const category of defaultCategories.rows) {
      await pool.query(
        'INSERT INTO user_topics (user_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [newUser.id, category.id]
      );
    }

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, is_admin: newUser.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: newUser.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
      [newUser.id, refreshToken]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        is_admin: newUser.is_admin,
        created_at: newUser.created_at,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query(
      'SELECT id, username, email, password, is_admin, created_at FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
      [user.id, refreshToken]
    );

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
app.post('/api/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2',
      [refreshToken, decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const userResult = await pool.query(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const newToken = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all news articles with pagination and filtering
app.get('/api/articles', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category_id, 
      user_id,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        na.id, na.title, na.content, na.published_at, na.image_url, 
        COALESCE(na.keywords, '[]'::JSONB) as keywords, 
        COALESCE(na.topics, '[]'::JSONB) as topics, 
        na.created_at,
        nc.name as category_name,
        u.username as author_name
      FROM news_articles na
      LEFT JOIN news_categories nc ON na.category_id = nc.id
      LEFT JOIN users u ON na.author_id = u.id
    `;
    
    const queryParams = [];
    const conditions = [];

    // Filter by user's preferred categories if user_id is provided
    if (user_id) {
      query += ` JOIN user_topics ut ON na.category_id = ut.category_id `;
      conditions.push(`ut.user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    // Filter by specific category
    if (category_id) {
      conditions.push(`na.category_id = $${queryParams.length + 1}`);
      queryParams.push(category_id);
    }

    // Search functionality
    if (search) {
      conditions.push(`(na.title ILIKE $${queryParams.length + 1} OR na.content ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY na.published_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM news_articles na`;
    const countParams = [];
    const countConditions = [];

    if (user_id) {
      countQuery += ` JOIN user_topics ut ON na.category_id = ut.category_id`;
      countConditions.push(`ut.user_id = $${countParams.length + 1}`);
      countParams.push(user_id);
    }

    if (category_id) {
      countConditions.push(`na.category_id = $${countParams.length + 1}`);
      countParams.push(category_id);
    }

    if (search) {
      countConditions.push(`(na.title ILIKE $${countParams.length + 1} OR na.content ILIKE $${countParams.length + 1})`);
      countParams.push(`%${search}%`);
    }

    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalArticles = parseInt(countResult.rows[0].count);

    res.json({
      articles: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalArticles / limit),
        totalArticles,
        articlesPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single article
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        na.id, na.title, na.content, na.published_at, na.image_url, 
        COALESCE(na.keywords, '[]'::JSONB) as keywords, 
        COALESCE(na.topics, '[]'::JSONB) as topics, 
        na.created_at,
        nc.name as category_name,
        u.username as author_name
      FROM news_articles na
      LEFT JOIN news_categories nc ON na.category_id = nc.id
      LEFT JOIN users u ON na.author_id = u.id
      WHERE na.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ article: result.rows[0] });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual sync articles endpoint
app.post('/api/admin/sync-articles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await getAllNewsArticles();
    res.json({ message: 'Articles synced successfully' });
  } catch (error) {
    console.error('Sync articles error:', error);
    res.status(500).json({ error: 'Failed to sync articles' });
  }
});

// Categories
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM news_categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User topics
app.get('/api/my-topics', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT nc.id, nc.name 
      FROM news_categories nc
      JOIN user_topics ut ON nc.id = ut.category_id
      WHERE ut.user_id = $1
      ORDER BY nc.name
    `,
      [req.user.id]
    );

    res.json({ topics: result.rows });
  } catch (error) {
    console.error('User topics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user topics
app.put('/api/my-topics', authenticateToken, async (req, res) => {
  try {
    const { category_ids } = req.body;

    if (!Array.isArray(category_ids)) {
      return res.status(400).json({ error: 'category_ids must be an array' });
    }

    await pool.query('DELETE FROM user_topics WHERE user_id = $1', [req.user.id]);

    for (const categoryId of category_ids) {
      await pool.query(
        'INSERT INTO user_topics (user_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, categoryId]
      );
    }

    res.json({ message: 'Topics updated successfully' });
  } catch (error) {
    console.error('Update topics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users, categories, articles] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM news_categories'),
      pool.query('SELECT COUNT(*) FROM news_articles'),
    ]);

    res.json({
      totalArticles: parseInt(articles.rows[0].count),
      totalUsers: parseInt(users.rows[0].count),
      activeCategories: parseInt(categories.rows[0].count),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, (SELECT COUNT(*) FROM news_articles WHERE category_id = news_categories.id) as article_count FROM news_categories ORDER BY name ASC'
    );
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await pool.query(
      'INSERT INTO news_categories (name) VALUES ($1) RETURNING id, name',
      [name]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    console.error('Add category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM news_categories WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user categories
app.get('/api/user/categories/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  try {
    const result = await pool.query(
      'SELECT id, name FROM news_categories WHERE id IN (SELECT category_id FROM user_topics WHERE user_id = $1) ORDER BY name ASC',
      [userId]
    );
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get user categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();

    // Initial sync of news articles
    await getAllNewsArticles();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Available endpoints:');
      console.log('- POST /api/register - Register new user');
      console.log('- POST /api/login - User login');
      console.log('- POST /api/refresh-token - Refresh access token');
      console.log('- GET /api/profile - Get user profile');
      console.log('- GET /api/articles - Get all articles with pagination');
      console.log('- GET /api/articles/:id - Get single article');
      console.log('- POST /api/admin/sync-articles - Manual sync articles (Admin only)');
      console.log('- GET /api/categories - Get all categories');
      console.log('- GET /api/my-topics - Get user topics');
      console.log('- PUT /api/my-topics - Update user topics');
      console.log('- GET /api/admin/stats - Get admin statistics');
      console.log('- GET /api/admin/users - Get all users (Admin only)');
      console.log('- DELETE /api/admin/users/:id - Delete user (Admin only)');
      console.log('- GET /api/admin/categories - Get all categories with article count (Admin only)');
      console.log('- POST /api/admin/categories - Create new category (Admin only)');
      console.log('- DELETE /api/admin/categories/:id - Delete category (Admin only)');
      console.log('- GET /api/user/categories/:user_id - Get user categories');
      console.log('- POST /api/logout - Logout user');
      console.log('- GET /health - Health check');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Schedule periodic sync of news articles (every 30 minutes)
setInterval(async () => {
  console.log('Running scheduled news sync...');
  try {
    await getAllNewsArticles();
  } catch (error) {
    console.error('Scheduled sync error:', error);
  }
}, 30 * 60 * 1000); // 30 minutes

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;