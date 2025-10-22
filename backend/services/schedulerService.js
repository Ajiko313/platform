const cron = require('node-cron');
const { Order, LoyaltyTransaction } = require('../models');
const { Op } = require('sequelize');

// Check for scheduled orders every minute
const checkScheduledOrders = cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    // Find orders scheduled for delivery in the next 5 minutes
    const scheduledOrders = await Order.findAll({
      where: {
        scheduledDeliveryTime: {
          [Op.lte]: new Date(now.getTime() + 5 * 60000),
          [Op.gte]: now
        },
        status: 'paid'
      }
    });

    for (const order of scheduledOrders) {
      // Update order status to preparing
      await order.update({ status: 'preparing' });
      
      console.log(`[Scheduler] Order #${order.id} scheduled for ${order.scheduledDeliveryTime} - starting preparation`);
      
      // Notify via notification service
      const { notifyOrderUpdate } = require('./notificationService');
      await notifyOrderUpdate(order, 'scheduled_order_started');
    }
  } catch (error) {
    console.error('[Scheduler] Error checking scheduled orders:', error);
  }
}, {
  scheduled: false
});

// Expire loyalty points (run daily at midnight)
const expireLoyaltyPoints = cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    
    // Find expired loyalty transactions
    const expiredTransactions = await LoyaltyTransaction.findAll({
      where: {
        expiresAt: {
          [Op.lt]: now
        },
        type: {
          [Op.in]: ['earned', 'bonus']
        }
      }
    });

    for (const transaction of expiredTransactions) {
      const { LoyaltyProgram } = require('../models');
      
      const loyaltyProgram = await LoyaltyProgram.findByPk(transaction.loyaltyProgramId);
      if (loyaltyProgram && loyaltyProgram.points >= transaction.points) {
        // Deduct expired points
        await loyaltyProgram.update({
          points: loyaltyProgram.points - transaction.points
        });

        // Create expiration record
        await LoyaltyTransaction.create({
          loyaltyProgramId: transaction.loyaltyProgramId,
          type: 'expired',
          points: -transaction.points,
          description: `Points expired from transaction #${transaction.id}`
        });

        console.log(`[Scheduler] Expired ${transaction.points} points for loyalty program #${transaction.loyaltyProgramId}`);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error expiring loyalty points:', error);
  }
}, {
  scheduled: false
});

// Check for abandoned orders (run every hour)
const checkAbandonedOrders = cron.schedule('0 * * * *', async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Find pending orders older than 1 hour
    const abandonedOrders = await Order.findAll({
      where: {
        status: 'pending',
        createdAt: {
          [Op.lt]: oneHourAgo
        }
      }
    });

    for (const order of abandonedOrders) {
      await order.update({ status: 'cancelled' });
      console.log(`[Scheduler] Cancelled abandoned order #${order.id}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error checking abandoned orders:', error);
  }
}, {
  scheduled: false
});

// Send daily analytics report to admins (run daily at 8 AM)
const sendDailyReport = cron.schedule('0 8 * * *', async () => {
  try {
    const { User } = require('../models');
    const { sendEmailNotification } = require('./notificationService');
    
    // Get yesterday's stats
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: yesterday,
          [Op.lt]: today
        }
      }
    });

    const dailyRevenue = await Order.sum('totalAmount', {
      where: {
        createdAt: {
          [Op.gte]: yesterday,
          [Op.lt]: today
        },
        status: 'delivered'
      }
    });

    // Get all admin users
    const admins = await User.findAll({
      where: { role: 'admin', isActive: true }
    });

    for (const admin of admins) {
      const message = `
        <h3>Daily Report - ${yesterday.toDateString()}</h3>
        <p><strong>Total Orders:</strong> ${dailyOrders}</p>
        <p><strong>Total Revenue:</strong> $${(dailyRevenue || 0).toFixed(2)}</p>
        <p><strong>Average Order Value:</strong> $${dailyOrders > 0 ? (dailyRevenue / dailyOrders).toFixed(2) : '0.00'}</p>
      `;
      
      await sendEmailNotification(admin.id, 'Daily Sales Report', message);
    }

    console.log('[Scheduler] Daily report sent to admins');
  } catch (error) {
    console.error('[Scheduler] Error sending daily report:', error);
  }
}, {
  scheduled: false
});

// Start all scheduled tasks
exports.start = () => {
  checkScheduledOrders.start();
  expireLoyaltyPoints.start();
  checkAbandonedOrders.start();
  sendDailyReport.start();
  
  console.log('[Scheduler] All cron jobs started');
};

// Stop all scheduled tasks
exports.stop = () => {
  checkScheduledOrders.stop();
  expireLoyaltyPoints.stop();
  checkAbandonedOrders.stop();
  sendDailyReport.stop();
  
  console.log('[Scheduler] All cron jobs stopped');
};

module.exports = exports;
