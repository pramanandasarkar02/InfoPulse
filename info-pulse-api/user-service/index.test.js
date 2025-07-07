const request = require('supertest');
const app = require('./'); // Adjust path to your server file
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// const request = require('supertest');
// const app = require('./index'); // Adjust path as needed
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const { Pool } = require('pg');

// jest.mock('pg', () => {
//   const mPool = {
//     query: jest.fn(),
//   };
//   return { Pool: jest.fn(() => mPool) };
// });

// const pool = new Pool();
// let server;

// describe('Express Server API', () => {
  

//   beforeEach(() => {
//     pool.query.mockReset();
//   });

//   // ... rest of the test file remains unchanged ...
// });



// Mock the pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const pool = new Pool();

describe('Express Server API', () => {
    beforeAll((done) => {
    server = app.listen(0, done); // Use port 0 to let the OS assign a free port
  });

  afterAll((done) => {
    server.close(done); // Close the server after tests
  });
  beforeEach(() => {
    pool.query.mockReset();
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpass123',
        is_admin: false,
      };

      // Mock database queries
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Check if user exists
        .mockResolvedValueOnce({ rows: [{ id: 1, ...newUser, password: await bcrypt.hash(newUser.password, 10) }] }) // Insert user
        .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }] }) // Default categories
        .mockResolvedValueOnce({ rows: [] }); // Insert user topics

      const response = await request(app)
        .post('/api/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'User created successfully',
        user: {
          id: 1,
          username: newUser.username,
          email: newUser.email,
          is_admin: newUser.is_admin,
        },
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Username, email, and password are required' });
    });

    it('should return 409 if username or email already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // User exists

      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'testpass123',
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Username or email already exists' });
    });
  });

  describe('POST /api/login', () => {
    it('should login user successfully', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('testpass123', 10),
        is_admin: false,
      };

      pool.query.mockResolvedValueOnce({ rows: [user] });

      const response = await request(app)
        .post('/api/login')
        .send({ username: 'testuser', password: 'testpass123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
      });
    });

    it('should return 401 for invalid credentials', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/login')
        .send({ username: 'testuser', password: 'wrongpass' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });

    it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Username and password are required' });
    });
  });

//   describe('GET /api/profile', () => {
//     it('should return user profile for authenticated user', async () => {
//       const user = {
//         id: 1,
//         username: 'testuser',
//         email: 'test@example.com',
//         is_admin: false,
//         created_at: new Date(),
//       };
//       const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, process.env.JWT_SECRET || 'your-secret-key');

//       pool.query.mockResolvedValueOnce({ rows: [user] });

//       const response = await request(app)
//         .get('/api/profile')
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(200);
//       expect(response.body.user).toEqual(user);
//     });

//     it('should return 401 if no token is provided', async () => {
//       const response = await request(app).get('/api/profile');

//       expect(response.status).toBe(401);
//       expect(response.body).toEqual({ error: 'Access token required' });
//     });

//     it('should return 403 for invalid token', async () => {
//       const response = await request(app)
//         .get('/api/profile')
//         .set('Authorization', 'Bearer invalidtoken');

//       expect(response.status).toBe(403);
//       expect(response.body).toEqual({ error: 'Invalid token' });
//     });
//   });

  describe('GET /api/categories', () => {
    it('should return all news categories', async () => {
      const categories = [
        { id: 1, name: 'Politics' },
        { id: 2, name: 'Technology' },
      ];
      const token = jwt.sign({ id: 1, username: 'testuser', is_admin: false }, process.env.JWT_SECRET || 'your-secret-key');

      pool.query.mockResolvedValueOnce({ rows: categories });

      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ categories });
    });
  });

  describe('GET /api/my-topics', () => {
    it('should return user’s selected topics', async () => {
      const topics = [
        { id: 1, name: 'Politics' },
        { id: 2, name: 'Technology' },
      ];
      const token = jwt.sign({ id: 1, username: 'testuser', is_admin: false }, process.env.JWT_SECRET || 'your-secret-key');

      pool.query.mockResolvedValueOnce({ rows: topics });

      const response = await request(app)
        .get('/api/my-topics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ topics });
    });
  });

  describe('PUT /api/my-topics', () => {
    it('should update user’s topics successfully', async () => {
      const token = jwt.sign({ id: 1, username: 'testuser', is_admin: false }, process.env.JWT_SECRET || 'your-secret-key');

      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Delete existing topics
        .mockResolvedValueOnce({ rows: [] }); // Insert new topics

      const response = await request(app)
        .put('/api/my-topics')
        .set('Authorization', `Bearer ${token}`)
        .send({ category_ids: [1, 2] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Topics updated successfully' });
    });

    it('should return 400 if category_ids is not an array', async () => {
      const token = jwt.sign({ id: 1, username: 'testuser', is_admin: false }, process.env.JWT_SECRET || 'your-secret-key');

      const response = await request(app)
        .put('/api/my-topics')
        .set('Authorization', `Bearer ${token}`)
        .send({ category_ids: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'category_ids must be an array' });
    });
  });

  describe('Admin Routes', () => {
    // describe('GET /api/admin/users', () => {
    //   it('should return all users for admin', async () => {
    //     const users = [
    //       { id: 1, username: 'admin', email: 'admin@example.com', is_admin: true, created_at: new Date() },
    //       { id: 2, username: 'testuser', email: 'test@example.com', is_admin: false, created_at: new Date() },
    //     ];
    //     const token = jwt.sign({ id: 1, username: 'admin', is_admin: true }, process.env.JWT_SECRET || 'your-secret-key');

    //     pool.query.mockResolvedValueOnce({ rows: users });

    //     const response = await request(app)
    //       .get('/api/admin/users')
    //       .set('Authorization', `Bearer ${token}`);

    //     expect(response.status).toBe(200);
    //     expect(response.body).toEqual({ users });
    //   });

    //   it('should return 403 for non-admin users', async () => {
    //     const token = jwt.sign({ id: 1, username: 'testuser', is_admin: false }, process.env.JWT_SECRET || 'your-secret-key');

    //     const response = await request(app)
    //       .get('/api/admin/users')
    //       .set('Authorization', `Bearer ${token}`);

    //     expect(response.status).toBe(403);
    //     expect(response.body).toEqual({ error: 'Admin access required' });
    //   });
    // });

    describe('DELETE /api/admin/users/:id', () => {
      it('should delete a user successfully for admin', async () => {
        const token = jwt.sign({ id: 1, username: 'admin', is_admin: true }, process.env.JWT_SECRET || 'your-secret-key');

        pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });

        const response = await request(app)
          .delete('/api/admin/users/2')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'User deleted successfully' });
      });

      it('should return 404 if user not found', async () => {
        const token = jwt.sign({ id: 1, username: 'admin', is_admin: true }, process.env.JWT_SECRET || 'your-secret-key');

        pool.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .delete('/api/admin/users/999')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'User not found' });
      });
    });

    describe('POST /api/admin/categories', () => {
      it('should create a new category for admin', async () => {
        const token = jwt.sign({ id: 1, username: 'admin', is_admin: true }, process.env.JWT_SECRET || 'your-secret-key');

        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'New Category' }] });

        const response = await request(app)
          .post('/api/admin/categories')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'New Category' });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
          message: 'Category created successfully',
          category: { id: 1, name: 'New Category' },
        });
      });

      it('should return 409 if category already exists', async () => {
        const token = jwt.sign({ id: 1, username: 'admin', is_admin: true }, process.env.JWT_SECRET || 'your-secret-key');

        pool.query.mockRejectedValueOnce({ code: '23505' });

        const response = await request(app)
          .post('/api/admin/categories')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Existing Category' });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: 'Category already exists' });
      });
    });

    describe('DELETE /api/admin/categories/:id', () => {
      it('should delete a category successfully for admin', async () => {
        const token = jwt.sign({ id: 1, username: 'admin', is_admin: true }, process.env.JWT_SECRET || 'your-secret-key');

        pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

        const response = await request(app)
          .delete('/api/admin/categories/1')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Category deleted successfully' });
      });

      it('should return 404 if category not found', async () => {
        const token = jwt.sign({ id: 1, username: 'admin', is_admin: true }, process.env.JWT_SECRET || 'your-secret-key');

        pool.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .delete('/api/admin/categories/999')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Category not found' });
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});