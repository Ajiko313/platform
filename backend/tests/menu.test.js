const request = require('supertest');
const app = require('../server');
const { sequelize, User, MenuItem } = require('../models');

describe('Menu API', () => {
  let adminToken, customerToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@test.com',
      password: 'admin123',
      firstName: 'Admin',
      role: 'admin'
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = adminLogin.body.token;

    // Create customer user
    const customerLogin = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'customer@test.com',
        password: 'customer123',
        firstName: 'Customer'
      });
    customerToken = customerLogin.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/menu', () => {
    it('should get all menu items (public access)', async () => {
      const response = await request(app).get('/api/menu');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should filter by category', async () => {
      await MenuItem.create({
        name: 'Burger',
        price: 10.99,
        category: 'Burgers'
      });

      const response = await request(app)
        .get('/api/menu?category=Burgers');

      expect(response.status).toBe(200);
      expect(response.body.items.every(item => item.category === 'Burgers')).toBe(true);
    });
  });

  describe('POST /api/menu', () => {
    it('should create menu item as admin', async () => {
      const response = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Pizza',
          description: 'Delicious test pizza',
          price: 15.99,
          category: 'Pizza',
          preparationTime: 20
        });

      expect(response.status).toBe(201);
      expect(response.body.item.name).toBe('Test Pizza');
    });

    it('should reject creation by customer', async () => {
      const response = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Item',
          price: 10.99,
          category: 'Test'
        });

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Item'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/menu/:id', () => {
    let itemId;

    beforeAll(async () => {
      const item = await MenuItem.create({
        name: 'Update Test',
        price: 10.99,
        category: 'Test'
      });
      itemId = item.id;
    });

    it('should update menu item as admin', async () => {
      const response = await request(app)
        .put(`/api/menu/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 12.99,
          isAvailable: false
        });

      expect(response.status).toBe(200);
      expect(response.body.item.price).toBe('12.99');
      expect(response.body.item.isAvailable).toBe(false);
    });

    it('should reject update by customer', async () => {
      const response = await request(app)
        .put(`/api/menu/${itemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ price: 5.99 });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/menu/:id', () => {
    it('should delete menu item as admin', async () => {
      const item = await MenuItem.create({
        name: 'Delete Test',
        price: 10.99,
        category: 'Test'
      });

      const response = await request(app)
        .delete(`/api/menu/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await MenuItem.findByPk(item.id);
      expect(deleted).toBeNull();
    });
  });
});
