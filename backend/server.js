const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { sequelize } = require('./models');
const socket = require('./socket');

// Routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/deliveries');
const paymentRoutes = require('./routes/payments');
const telegramRoutes = require('./routes/telegram');
const reviewRoutes = require('./routes/reviews');
const promoCodeRoutes = require('./routes/promoCodes');
const restaurantRoutes = require('./routes/restaurants');
const loyaltyRoutes = require('./routes/loyalty');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socket.init(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;

// Initialize scheduler for scheduled deliveries
const schedulerService = require('./services/schedulerService');

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync models (in production, use migrations)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database models synchronized');

    // Start scheduler for scheduled deliveries
    schedulerService.start();
    console.log('✅ Scheduler service started');

    // Create default admin user if doesn't exist
    const { User, MenuItem } = require('./models');
    const adminExists = await User.findOne({ where: { email: process.env.ADMIN_EMAIL } });
    
    if (!adminExists) {
      await User.create({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });
      console.log('✅ Default admin user created');
    }

    // Create sample menu items if database is empty
    const itemCount = await MenuItem.count();
    if (itemCount === 0) {
      await MenuItem.bulkCreate([
        {
          name: 'Classic Burger',
          description: 'Juicy beef patty with lettuce, tomato, and special sauce',
          price: 12.99,
          category: 'Burgers',
          preparationTime: 15,
          isAvailable: true
        },
        {
          name: 'Cheese Pizza',
          description: 'Traditional pizza with mozzarella cheese',
          price: 14.99,
          category: 'Pizza',
          preparationTime: 20,
          isAvailable: true
        },
        {
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with Caesar dressing and croutons',
          price: 9.99,
          category: 'Salads',
          preparationTime: 10,
          isAvailable: true
        },
        {
          name: 'French Fries',
          description: 'Crispy golden fries',
          price: 4.99,
          category: 'Sides',
          preparationTime: 8,
          isAvailable: true
        },
        {
          name: 'Chocolate Milkshake',
          description: 'Rich and creamy chocolate shake',
          price: 5.99,
          category: 'Drinks',
          preparationTime: 5,
          isAvailable: true
        }
      ]);
      console.log('✅ Sample menu items created');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
      console.log(`\nEnvironment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
