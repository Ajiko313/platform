const { Payment, Order } = require('../models');
const crypto = require('crypto');
const { notifyPaymentUpdate } = require('../services/notificationService');

exports.createPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Authorization check
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Order is not in pending status',
        currentStatus: order.status
      });
    }

    // Create payment record
    const payment = await Payment.create({
      orderId,
      amount: order.totalAmount,
      method,
      status: 'processing',
      externalId: `PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    });

    // Simulate payment processing (in real app, this would call payment gateway)
    if (method === 'cash') {
      await payment.update({ status: 'completed' });
      await order.update({ 
        paymentStatus: 'completed',
        paymentId: payment.externalId,
        status: 'paid'
      });
    }

    res.status(201).json({
      message: 'Payment initiated successfully',
      payment,
      paymentUrl: method === 'card' ? `https://payment-gateway.example.com/pay/${payment.externalId}` : null
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const { externalId, status, signature } = req.body;

    // Verify webhook signature (simplified)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET)
      .update(externalId + status)
      .digest('hex');

    if (signature !== expectedSignature && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payment = await Payment.findOne({ where: { externalId } });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await payment.update({ status });

    const order = await Order.findByPk(payment.orderId);
    
    if (status === 'completed') {
      await order.update({ 
        paymentStatus: 'completed',
        paymentId: externalId,
        status: 'paid'
      });
      
      await notifyPaymentUpdate(order, payment, 'completed');
    } else if (status === 'failed') {
      await order.update({ paymentStatus: 'failed' });
      await notifyPaymentUpdate(order, payment, 'failed');
    }

    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { externalId: req.params.externalId },
      include: [{ model: Order, as: 'order' }]
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Only completed payments can be refunded',
        currentStatus: payment.status
      });
    }

    await payment.update({ status: 'refunded' });

    const order = await Order.findByPk(payment.orderId);
    await order.update({ paymentStatus: 'refunded' });

    await notifyPaymentUpdate(order, payment, 'refunded');

    res.json({
      message: 'Payment refunded successfully',
      payment
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
};
