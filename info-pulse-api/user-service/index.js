const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';

// Middleware
app.use(cors({
  // origin: 'http://localhost:3000', // Allow frontend origin
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

// Initialize database
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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

    // Create news_articles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news_articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category_id INTEGER REFERENCES news_categories(id) ON DELETE SET NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_url VARCHAR(255)
      )
    `);

    // Create user_topics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_topics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES news_categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category_id)
      )
    `);

    // Create refresh_tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
    console.error('Database initialization error:', error.message);
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
    console.error('Registration error:', error.message);
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
    console.error('Login error:', error.message);
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
    console.error('Refresh token error:', error.message);
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
    console.error('Profile error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Categories
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM news_categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Categories error:', error.message);
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
    console.error('User topics error:', error.message);
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
    console.error('Update topics error:', error.message);
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
    console.error('Admin stats error:', error.message);
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
    console.error('Admin users error:', error.message);
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
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name FROM news_categories ORDER BY name ASC'
    );
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error.message);
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
    console.error('Add category error:', error.message);
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
    console.error('Delete category error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get user categories
app.get('/api/user/categories/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  try {
    const result = await pool.query(
      'SELECT id, name FROM news_categories WHERE id IN (SELECT category_id FROM user_topics WHERE user_id = $1) ORDER BY name ASC',
      [userId]
    );
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
})


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;