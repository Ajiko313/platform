const io = require('../socket');
const { Notification, User } = require('../models');

// Email service (using nodemailer)
const nodemailer = require('nodemailer');

// SMS service (using Twilio)
// const twilio = require('twilio');
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Push notification service (using Firebase or OneSignal)
// const admin = require('firebase-admin');

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// This service handles real-time notifications
// Supports: Socket.IO, Email, SMS, Push Notifications, Telegram

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

    // Send email notification
    await sendEmailNotification(order.customerId, 'Order Update', getOrderMessage(order, event), order.id);
    
    // Send SMS notification if enabled
    if (process.env.SMS_ENABLED === 'true') {
      await sendSMSNotification(order.customerId, getOrderMessage(order, event));
    }
    
    // Send push notification
    if (process.env.PUSH_ENABLED === 'true') {
      await sendPushNotification(order.customerId, 'Order Update', getOrderMessage(order, event), order.id);
    }
    
    // Send Telegram notification
    if (process.env.TELEGRAM_ENABLED === 'true') {
      await sendTelegramNotification(order.customerId, getOrderMessage(order, event));
    }
    
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

// Email notification
async function sendEmailNotification(userId, subject, message, orderId = null) {
  try {
    if (!process.env.SMTP_USER) {
      console.log('[Email] SMTP not configured, skipping email notification');
      return;
    }

    const user = await User.findByPk(userId);
    if (!user || !user.email) {
      console.log('[Email] User email not found');
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">${subject}</h2>
          <p>${message}</p>
          ${orderId ? `<p>Order ID: #${orderId}</p>` : ''}
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Food Delivery Platform.
          </p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);

    // Log notification
    await Notification.create({
      userId,
      orderId,
      type: 'email',
      title: subject,
      message,
      status: 'sent',
      sentAt: new Date()
    });

    console.log(`[Email] Sent to ${user.email}: ${subject}`);
  } catch (error) {
    console.error('[Email] Error:', error.message);
    
    // Log failed notification
    await Notification.create({
      userId,
      orderId,
      type: 'email',
      title: subject,
      message,
      status: 'failed',
      errorMessage: error.message
    });
  }
}

// SMS notification
async function sendSMSNotification(userId, message) {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.phone) {
      console.log('[SMS] User phone not found');
      return;
    }

    // Twilio implementation (commented out - requires Twilio account)
    /*
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone
    });
    */

    // Log notification
    await Notification.create({
      userId,
      type: 'sms',
      title: 'Order Update',
      message,
      status: 'sent',
      sentAt: new Date(),
      metadata: JSON.stringify({ phone: user.phone })
    });

    console.log(`[SMS] Would send to ${user.phone}: ${message}`);
  } catch (error) {
    console.error('[SMS] Error:', error.message);
    
    await Notification.create({
      userId,
      type: 'sms',
      title: 'Order Update',
      message,
      status: 'failed',
      errorMessage: error.message
    });
  }
}

// Push notification
async function sendPushNotification(userId, title, message, orderId = null) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      console.log('[Push] User not found');
      return;
    }

    // Firebase Cloud Messaging implementation (commented out - requires Firebase setup)
    /*
    const payload = {
      notification: {
        title: title,
        body: message,
        icon: '/icon.png',
        click_action: orderId ? `/orders/${orderId}` : '/'
      }
    };

    if (user.fcmToken) {
      await admin.messaging().sendToDevice(user.fcmToken, payload);
    }
    */

    // Log notification
    await Notification.create({
      userId,
      orderId,
      type: 'push',
      title,
      message,
      status: 'sent',
      sentAt: new Date()
    });

    console.log(`[Push] Would send to user ${userId}: ${title}`);
  } catch (error) {
    console.error('[Push] Error:', error.message);
    
    await Notification.create({
      userId,
      orderId,
      type: 'push',
      title,
      message,
      status: 'failed',
      errorMessage: error.message
    });
  }
}

// Telegram notification
async function sendTelegramNotification(userId, message) {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.telegramId) {
      console.log('[Telegram] User Telegram ID not found');
      return;
    }

    // Telegram Bot API implementation
    const axios = require('axios');
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (TELEGRAM_BOT_TOKEN) {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: user.telegramId,
        text: message,
        parse_mode: 'HTML'
      });

      await Notification.create({
        userId,
        type: 'telegram',
        title: 'Order Update',
        message,
        status: 'sent',
        sentAt: new Date()
      });

      console.log(`[Telegram] Sent to ${user.telegramId}: ${message}`);
    } else {
      console.log('[Telegram] Bot token not configured');
    }
  } catch (error) {
    console.error('[Telegram] Error:', error.message);
    
    await Notification.create({
      userId,
      type: 'telegram',
      title: 'Order Update',
      message,
      status: 'failed',
      errorMessage: error.message
    });
  }
}

// Get user notifications
exports.getUserNotifications = async (userId, limit = 50) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit
    });
    return notifications;
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByPk(notificationId);
    if (notification) {
      await notification.update({
        status: 'read',
        readAt: new Date()
      });
    }
  } catch (error) {
    console.error('Mark notification as read error:', error);
  }
};

// Export individual notification functions for use in other controllers
exports.sendEmailNotification = sendEmailNotification;
exports.sendSMSNotification = sendSMSNotification;
exports.sendPushNotification = sendPushNotification;
exports.sendTelegramNotification = sendTelegramNotification;
