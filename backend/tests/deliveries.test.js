const request = require('supertest');
const app = require('../server');
const { sequelize, User, MenuItem, Order, Delivery } = require('../models');

describe('Deliveries API', () => {
  let customerToken, driverToken, adminToken, menuItem, order;

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

    // Create driver
    const driverRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'driver@test.com',
        password: 'driver123',
        firstName: 'Driver',
        role: 'delivery'
      });
    driverToken = driverRes.body.token;

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

    // Create order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ menuItemId: menuItem.id, quantity: 1 }],
        deliveryAddress: '123 Test Street',
        customerPhone: '+1234567890'
      });
    order = orderRes.body.order;

    // Update order to ready status
    await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'paid' });

    await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'preparing' });

    await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ready' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/deliveries/available', () => {
    it('should get available deliveries for driver', async () => {
      const response = await request(app)
        .get('/api/deliveries/available')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.deliveries).toBeDefined();
      expect(Array.isArray(response.body.deliveries)).toBe(true);
    });

    it('should reject non-driver access', async () => {
      const response = await request(app)
        .get('/api/deliveries/available')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/deliveries/:id/accept', () => {
    let deliveryId;

    beforeAll(async () => {
      const delivery = await Delivery.findOne({ where: { orderId: order.id } });
      deliveryId = delivery.id;
    });

    it('should allow driver to accept delivery', async () => {
      const response = await request(app)
        .post(`/api/deliveries/${deliveryId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.delivery.status).toBe('assigned');
      expect(response.body.delivery.driverId).toBeDefined();
    });

    it('should reject already assigned delivery', async () => {
      const response = await request(app)
        .post(`/api/deliveries/${deliveryId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/deliveries/:id/status', () => {
    let deliveryId;

    beforeAll(async () => {
      const delivery = await Delivery.findOne({ where: { orderId: order.id } });
      deliveryId = delivery.id;
    });

    it('should update delivery status by assigned driver', async () => {
      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: 'picked_up' });

      expect(response.status).toBe(200);
      expect(response.body.delivery.status).toBe('picked_up');
      expect(response.body.delivery.pickupTime).toBeDefined();
    });

    it('should update to delivered and complete order', async () => {
      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: 'delivered' });

      expect(response.status).toBe(200);
      expect(response.body.delivery.status).toBe('delivered');
      expect(response.body.delivery.deliveryTime).toBeDefined();

      // Verify order is also marked as delivered
      const orderCheck = await Order.findByPk(order.id);
      expect(orderCheck.status).toBe('delivered');
    });
  });

  describe('GET /api/deliveries/my', () => {
    it('should get driver\'s deliveries', async () => {
      const response = await request(app)
        .get('/api/deliveries/my')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.deliveries).toBeDefined();
      expect(Array.isArray(response.body.deliveries)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/deliveries/my?status=delivered')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.deliveries.every(d => d.status === 'delivered')).toBe(true);
    });
  });
});
