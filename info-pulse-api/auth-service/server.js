import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;



app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use((req, res, next) => {
    console.log("Received request:", req.method, req.url , req.body );
    next();
})

const pool = new pg.Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'info-pulse-db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// User roles
const ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

const initializeDatabase = async () => {
    try {
        // Create users table with role support
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            );
        `);

        // Create admin logs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_logs (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES users(id),
                action VARCHAR(255) NOT NULL,
                target_user_id INTEGER,
                details JSONB,
                ip_address INET,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }

    // Create default admin and demo users
    try {
        const existingUsers = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(existingUsers.rows[0].count) === 0) {
            // Create super admin
            const adminPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
                ['admin', 'admin@example.com', adminPassword, ROLES.SUPER_ADMIN]
            );

            // Create regular admin
            const regularAdminPassword = await bcrypt.hash('moderator123', 10);
            await pool.query(
                'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
                ['moderator', 'moderator@example.com', regularAdminPassword, ROLES.ADMIN]
            );

            // Create demo user
            const userPassword = await bcrypt.hash('demo123', 10);
            await pool.query(
                'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
                ['demouser', 'demo@example.com', userPassword, ROLES.USER]
            );

            console.log('Default users created:');
            console.log('Super Admin: admin@example.com / admin123');
            console.log('Admin: moderator@example.com / moderator123');
            console.log('User: demo@example.com / demo123');
        }
    } catch (error) {
        console.error('Error creating default users:', error);
    }
};

// Helper function to log admin actions
const logAdminAction = async (adminId, action, targetUserId = null, details = null, ipAddress = null) => {
    try {
        await pool.query(
            'INSERT INTO admin_logs (admin_id, action, target_user_id, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [adminId, action, targetUserId, details, ipAddress]
        );
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
};



// Signup endpoint
app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log("Information:", username, email, password);

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, ROLES.USER]
        );

        const user = result.rows[0];
        const token = jwt.sign({ 
            userId: user.id, 
            username: user.username, 
            role: user.role 
        }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                role: user.role 
            }, 
            token 
        });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        // console.log("getting login");
        const { email, password } = req.body;

        // console.log("Information:", email, password);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const result = await pool.query(
            'SELECT id, username, email, password, role, is_active FROM users WHERE email = $1',
            [email]
        );

        console.log("Result:", result.rows[0]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        const token = jwt.sign({ 
            userId: user.id, 
            username: user.username, 
            role: user.role 
        }, JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                role: user.role 
            }, 
            token 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Token validation endpoint
app.get('/validate', async (req, res) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(400).json({ error: 'Authorization header is required' });
        }

        // Expect "Bearer <token>" format
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        console.log("Token:", token);

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Fetch fresh user data
        const result = await pool.query(
            'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(401).json({ error: 'User not found or deactivated' });
        }

        const user = result.rows[0];
        res.status(200).json({ user });
    } catch (error) {
        console.error('Validation error:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Invalid or expired token' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Middleware to authenticate requests
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // Check if user is still active
        const result = await pool.query('SELECT is_active FROM users WHERE id = $1', [user.userId]);
        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(403).json({ error: 'Account deactivated' });
        }

        req.user = user;
        next();
    });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Middleware to check super admin role
const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
};


app.get('/users/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, role, is_active FROM users');
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})
// ADMIN ENDPOINTS



// Get all users (Admin only)
app.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT id, username, email, role, is_active, created_at, last_login FROM users WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (role) {
            paramCount++;
            query += ` AND role = $${paramCount}`;
            params.push(role);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (search) {
            countParamCount++;
            countQuery += ` AND (username ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        if (role) {
            countParamCount++;
            countQuery += ` AND role = $${countParamCount}`;
            countParams.push(role);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalUsers = parseInt(countResult.rows[0].count);

        await logAdminAction(req.user.userId, 'VIEW_USERS', null, { search, role, page }, req.ip);

        res.json({
            users: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit)
            }
        });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user role (Super Admin only)
app.put('/admin/users/:id/role', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!Object.values(ROLES).includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const result = await pool.query(
            'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        await logAdminAction(req.user.userId, 'UPDATE_USER_ROLE', parseInt(id), { newRole: role }, req.ip);

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Activate/Deactivate user (Admin only)
app.put('/admin/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'is_active must be a boolean' });
        }

        // Prevent admins from deactivating themselves
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ error: 'Cannot change your own status' });
        }

        const result = await pool.query(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role, is_active',
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        await logAdminAction(
            req.user.userId, 
            is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 
            parseInt(id), 
            { status: is_active }, 
            req.ip
        );

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user (Super Admin only)
app.delete('/admin/users/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent super admins from deleting themselves
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING username, email',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        await logAdminAction(req.user.userId, 'DELETE_USER', parseInt(id), { deletedUser: result.rows[0] }, req.ip);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get admin logs (Admin only)
app.get('/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, action = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT al.*, u.username as admin_username, tu.username as target_username
            FROM admin_logs al
            LEFT JOIN users u ON al.admin_id = u.id
            LEFT JOIN users tu ON al.target_user_id = tu.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (action) {
            paramCount++;
            query += ` AND al.action = $${paramCount}`;
            params.push(action);
        }

        query += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM admin_logs WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (action) {
            countParamCount++;
            countQuery += ` AND action = $${countParamCount}`;
            countParams.push(action);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalLogs = parseInt(countResult.rows[0].count);

        res.json({
            logs: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalLogs,
                pages: Math.ceil(totalLogs / limit)
            }
        });
    } catch (error) {
        console.error('Get admin logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get dashboard stats (Admin only)
app.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM users'),
            pool.query('SELECT COUNT(*) as active FROM users WHERE is_active = true'),
            pool.query('SELECT COUNT(*) as inactive FROM users WHERE is_active = false'),
            pool.query('SELECT COUNT(*) as admins FROM users WHERE role IN ($1, $2)', [ROLES.ADMIN, ROLES.SUPER_ADMIN]),
            pool.query('SELECT COUNT(*) as today FROM users WHERE DATE(created_at) = CURRENT_DATE'),
            pool.query(`
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM users 
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' 
                GROUP BY DATE(created_at) 
                ORDER BY date
            `)
        ]);

        res.json({
            totalUsers: parseInt(stats[0].rows[0].total),
            activeUsers: parseInt(stats[1].rows[0].active),
            inactiveUsers: parseInt(stats[2].rows[0].inactive),
            adminUsers: parseInt(stats[3].rows[0].admins),
            newUsersToday: parseInt(stats[4].rows[0].today),
            weeklySignups: stats[5].rows
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// USER ENDPOINTS

// Get user profile
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1',
            [req.user.userId]
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

// Update user profile
app.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ error: 'Username and email are required' });
        }

        const result = await pool.query(
            'UPDATE users SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, role',
            [username, email, req.user.userId]
        );

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Change password
app.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        // Verify current password
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.userId]);
        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedNewPassword, req.user.userId]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const startServer = async () => {
    await initializeDatabase();
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        console.log('\n=== Default Admin Accounts ===');
        console.log('Super Admin: admin@example.com / admin123');
        console.log('Admin: moderator@example.com / moderator123');
        console.log('User: demo@example.com / demo123');
        console.log('===============================\n');
    });
};

startServer().catch(console.error);