const request = require('supertest');
const app = require('../server');
const { sequelize, User, MenuItem, Order, Payment } = require('../models');
const crypto = require('crypto');

describe('Payments API', () => {
  let customerToken, adminToken, menuItem, order;

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
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/payments', () => {
    it('should create payment for order', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          method: 'card'
        });

      expect(response.status).toBe(201);
      expect(response.body.payment).toHaveProperty('id');
      expect(response.body.payment.status).toBe('processing');
      expect(response.body.payment.orderId).toBe(order.id);
    });

    it('should auto-complete cash payment', async () => {
      // Create new order for cash test
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: menuItem.id, quantity: 1 }],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: orderRes.body.order.id,
          method: 'cash'
        });

      expect(response.status).toBe(201);
      expect(response.body.payment.status).toBe('completed');

      // Verify order status updated
      const orderCheck = await Order.findByPk(orderRes.body.order.id);
      expect(orderCheck.status).toBe('paid');
    });

    it('should reject payment for non-pending order', async () => {
      // Create and complete an order
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: menuItem.id, quantity: 1 }],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: orderRes.body.order.id,
          method: 'cash'
        });

      // Try to pay again
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: orderRes.body.order.id,
          method: 'card'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/payments/webhook', () => {
    let payment;

    beforeAll(async () => {
      const paymentRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          method: 'card'
        });
      payment = paymentRes.body.payment;
    });

    it('should process payment webhook successfully', async () => {
      const signature = crypto
        .createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET)
        .update(payment.externalId + 'completed')
        .digest('hex');

      const response = await request(app)
        .post('/api/payments/webhook')
        .send({
          externalId: payment.externalId,
          status: 'completed',
          signature
        });

      expect(response.status).toBe(200);

      // Verify payment updated
      const updatedPayment = await Payment.findByPk(payment.id);
      expect(updatedPayment.status).toBe('completed');

      // Verify order updated
      const updatedOrder = await Order.findByPk(order.id);
      expect(updatedOrder.paymentStatus).toBe('completed');
      expect(updatedOrder.status).toBe('paid');
    });

    it('should handle failed payment webhook', async () => {
      // Create new payment
      const newOrderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: menuItem.id, quantity: 1 }],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });

      const newPaymentRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: newOrderRes.body.order.id,
          method: 'card'
        });

      const signature = crypto
        .createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET)
        .update(newPaymentRes.body.payment.externalId + 'failed')
        .digest('hex');

      const response = await request(app)
        .post('/api/payments/webhook')
        .send({
          externalId: newPaymentRes.body.payment.externalId,
          status: 'failed',
          signature
        });

      expect(response.status).toBe(200);

      // Verify payment failed
      const payment = await Payment.findOne({ 
        where: { externalId: newPaymentRes.body.payment.externalId } 
      });
      expect(payment.status).toBe('failed');
    });
  });

  describe('GET /api/payments/status/:externalId', () => {
    let payment;

    beforeAll(async () => {
      const paymentRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          method: 'card'
        });
      payment = paymentRes.body.payment;
    });

    it('should get payment status', async () => {
      const response = await request(app)
        .get(`/api/payments/status/${payment.externalId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.payment.externalId).toBe(payment.externalId);
    });
  });

  describe('POST /api/payments/:id/refund', () => {
    it('should refund completed payment as admin', async () => {
      // Create and complete payment
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: menuItem.id, quantity: 1 }],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });

      const paymentRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: orderRes.body.order.id,
          method: 'cash'
        });

      const response = await request(app)
        .post(`/api/payments/${paymentRes.body.payment.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.payment.status).toBe('refunded');
    });

    it('should reject refund by customer', async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: menuItem.id, quantity: 1 }],
          deliveryAddress: '123 Test Street',
          customerPhone: '+1234567890'
        });

      const paymentRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: orderRes.body.order.id,
          method: 'cash'
        });

      const response = await request(app)
        .post(`/api/payments/${paymentRes.body.payment.id}/refund`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });
});
