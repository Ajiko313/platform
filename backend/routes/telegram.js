const express = require('express');
const router = express.Router();
const { User, MenuItem, Order, OrderItem, Delivery } = require('../models');

// Telegram Bot webhook handler
router.post('/webhook', async (req, res) => {
  try {
    const { message, callback_query } = req.body;

    if (message) {
      await handleMessage(message);
    }

    if (callback_query) {
      await handleCallbackQuery(callback_query);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.json({ ok: true }); // Always return ok to Telegram
  }
});

async function handleMessage(message) {
  const { from, text, chat } = message;
  
  // Find or create user
  let user = await User.findOne({ where: { telegramId: from.id.toString() } });
  
  if (!user) {
    user = await User.create({
      telegramId: from.id.toString(),
      firstName: from.first_name,
      lastName: from.last_name || '',
      role: 'customer'
    });
  }

  // Handle commands
  if (text) {
    const command = text.split(' ')[0].toLowerCase();
    
    switch (command) {
      case '/start':
        await sendMessage(chat.id, 'Welcome to Delicious Bites! 🍔\n\nUse /menu to browse our menu\nUse /orders to see your orders\nUse /help for more commands');
        break;
        
      case '/menu':
        const items = await MenuItem.findAll({ where: { isAvailable: true } });
        let menuText = '📋 *Our Menu*\n\n';
        
        const categories = [...new Set(items.map(item => item.category))];
        for (const category of categories) {
          menuText += `\n*${category}*\n`;
          const categoryItems = items.filter(item => item.category === category);
          categoryItems.forEach(item => {
            menuText += `${item.name} - $${item.price}\n${item.description}\n\n`;
          });
        }
        
        await sendMessage(chat.id, menuText);
        break;
        
      case '/orders':
        const orders = await Order.findAll({
          where: { customerId: user.id },
          include: [{ model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] }],
          order: [['createdAt', 'DESC']],
          limit: 5
        });
        
        if (orders.length === 0) {
          await sendMessage(chat.id, 'You have no orders yet. Use /menu to start ordering!');
        } else {
          let ordersText = '📦 *Your Recent Orders*\n\n';
          orders.forEach(order => {
            ordersText += `Order #${order.id}\n`;
            ordersText += `Status: ${order.status}\n`;
            ordersText += `Total: $${order.totalAmount}\n`;
            ordersText += `Date: ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
          });
          await sendMessage(chat.id, ordersText);
        }
        break;
        
      case '/help':
        await sendMessage(chat.id, 
          '*Available Commands*\n\n' +
          '/start - Welcome message\n' +
          '/menu - View our menu\n' +
          '/orders - View your orders\n' +
          '/track <order_id> - Track an order\n' +
          '/help - Show this help message'
        );
        break;
        
      default:
        await sendMessage(chat.id, 'Sorry, I didn\'t understand that command. Use /help to see available commands.');
    }
  }
}

async function handleCallbackQuery(callbackQuery) {
  const { data, message, from } = callbackQuery;
  // Handle inline keyboard callbacks
  console.log('Callback query:', data);
}

async function sendMessage(chatId, text, options = {}) {
  // In production, this would call Telegram API
  console.log(`[Telegram] Sending to ${chatId}: ${text}`);
  // TODO: Implement actual Telegram API call
}

module.exports = router;
