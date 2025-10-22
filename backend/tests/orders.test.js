const request = require('supertest');
const app = require('../server');
const { sequelize, User, MenuItem, Order } = require('../models');

describe('Orders API', () => {
  let customerToken, adminToken, menuItem;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create customer
    const customerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'customer@test.com',
        password: 'customer123',
        firstName: 'Customer',
        phone: '+1234567890'
      });
    customerToken = customerRes.body.token;

    // Create admin
    await User.create({
      email: 'admin@test.com',
      password: 'admin123',
      firstName: 'Admin',
      role: 'admin'
    });
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = adminRes.body.token;

    // Create menu item
    menuItem = await MenuItem.create({
      name: 'Test Burger',
      price: 12.99,
      category: 'Burgers',
      isAvailable: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/orders', () => {
    it('should create order successfully', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            { menuItemId: menuItem.id, quantity: 2 }
          ],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body.order).toHaveProperty('id');
      expect(response.body.order.status).toBe('pending');
      expect(response.body.order.items).toHaveLength(1);
      expect(parseFloat(response.body.order.totalAmount)).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: []
        });

      expect(response.status).toBe(400);
    });

    it('should reject unavailable items', async () => {
      const unavailableItem = await MenuItem.create({
        name: 'Unavailable Item',
        price: 10.99,
        category: 'Test',
        isAvailable: false
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: unavailableItem.id, quantity: 1 }],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not available');
    });
  });

  describe('GET /api/orders', () => {
    it('should get customer orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toBeDefined();
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=pending')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders.every(o => o.status === 'pending')).toBe(true);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    let orderId;

    beforeAll(async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: menuItem.id, quantity: 1 }],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });
      orderId = orderRes.body.order.id;
    });

    it('should update order status as admin', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'paid' });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('paid');
    });

    it('should reject invalid status transition', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot transition');
    });

    it('should reject status update by customer', async () => {
      const response = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'preparing' });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/orders/:id/cancel', () => {
    it('should allow customer to cancel own order', async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: menuItem.id, quantity: 1 }],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });

      const response = await request(app)
        .post(`/api/orders/${orderRes.body.order.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('cancelled');
    });

    it('should not cancel order in advanced stage', async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: menuItem.id, quantity: 1 }],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });

      // Update to delivered
      await request(app)
        .patch(`/api/orders/${orderRes.body.order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'paid' });

      await request(app)
        .patch(`/api/orders/${orderRes.body.order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'preparing' });

      await request(app)
        .patch(`/api/orders/${orderRes.body.order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ready' });

      await request(app)
        .patch(`/api/orders/${orderRes.body.order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'out_for_delivery' });

      const response = await request(app)
        .post(`/api/orders/${orderRes.body.order.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(400);
    });
  });
});
