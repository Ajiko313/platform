const io = require('../socket');

// This service handles real-time notifications
// In production, this would also send Telegram messages, SMS, push notifications, etc.

exports.notifyOrderUpdate = async (order, event) => {
  try {
    console.log(`[Notification] Order #${order.id} - Event: ${event}`);
    
    // Emit to Socket.IO for real-time dashboard updates
    if (io.instance) {
      io.instance.emit('order:update', {
        orderId: order.id,
        status: order.status,
        event,
        order
      });

      // Notify customer
      io.instance.to(`user:${order.customerId}`).emit('order:notification', {
        type: 'order_update',
        message: getOrderMessage(order, event),
        order
      });

      // Notify admins
      io.instance.to('admin').emit('order:admin_notification', {
        type: 'order_update',
        order
      });
    }

    // TODO: Send Telegram notification to customer
    // TODO: Send SMS notification if enabled
    
    return true;
  } catch (error) {
    console.error('Notification error:', error);
    return false;
  }
};

exports.notifyDeliveryUpdate = async (delivery, event) => {
  try {
    console.log(`[Notification] Delivery #${delivery.id} - Event: ${event}`);
    
    if (io.instance) {
      io.instance.emit('delivery:update', {
        deliveryId: delivery.id,
        status: delivery.status,
        event,
        delivery
      });

      // Notify customer
      if (delivery.order) {
        io.instance.to(`user:${delivery.order.customerId}`).emit('delivery:notification', {
          type: 'delivery_update',
          message: getDeliveryMessage(delivery, event),
          delivery
        });
      }

      // Notify driver
      if (delivery.driverId) {
        io.instance.to(`user:${delivery.driverId}`).emit('delivery:driver_notification', {
          type: 'delivery_update',
          delivery
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Delivery notification error:', error);
    return false;
  }
};

exports.notifyPaymentUpdate = async (order, payment, event) => {
  try {
    console.log(`[Notification] Payment #${payment.id} - Event: ${event}`);
    
    if (io.instance) {
      io.instance.emit('payment:update', {
        paymentId: payment.id,
        status: payment.status,
        event,
        payment
      });

      // Notify customer
      io.instance.to(`user:${order.customerId}`).emit('payment:notification', {
        type: 'payment_update',
        message: getPaymentMessage(payment, event),
        payment,
        order
      });
    }

    return true;
  } catch (error) {
    console.error('Payment notification error:', error);
    return false;
  }
};

function getOrderMessage(order, event) {
  const messages = {
    'created': 'Your order has been placed successfully!',
    'status_pending_to_paid': 'Payment received! Your order is being prepared.',
    'status_paid_to_preparing': 'Your order is being prepared.',
    'status_preparing_to_ready': 'Your order is ready for pickup!',
    'status_ready_to_out_for_delivery': 'Your order is out for delivery!',
    'status_out_for_delivery_to_delivered': 'Your order has been delivered. Enjoy!',
    'cancelled': 'Your order has been cancelled.'
  };
  return messages[event] || 'Order status updated';
}

function getDeliveryMessage(delivery, event) {
  const messages = {
    'accepted': 'A driver has accepted your delivery!',
    'status_picked_up': 'Your order has been picked up by the driver.',
    'status_in_transit': 'Your order is on the way!',
    'status_delivered': 'Your order has been delivered!'
  };
  return messages[event] || 'Delivery status updated';
}

function getPaymentMessage(payment, event) {
  const messages = {
    'completed': 'Payment successful!',
    'failed': 'Payment failed. Please try again.',
    'refunded': 'Payment has been refunded.'
  };
  return messages[event] || 'Payment status updated';
}
