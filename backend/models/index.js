const sequelize = require('../config/database');
const User = require('./User');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Delivery = require('./Delivery');
const Payment = require('./Payment');
const Review = require('./Review');
const PromoCode = require('./PromoCode');
const PromoCodeUsage = require('./PromoCodeUsage');
const Restaurant = require('./Restaurant');
const LoyaltyProgram = require('./LoyaltyProgram');
const LoyaltyTransaction = require('./LoyaltyTransaction');
const Notification = require('./Notification');

// Define relationships

// User relationships
User.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Delivery, { foreignKey: 'driverId', as: 'deliveries' });
Delivery.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

User.hasMany(Review, { foreignKey: 'customerId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

User.hasOne(LoyaltyProgram, { foreignKey: 'customerId', as: 'loyaltyProgram' });
LoyaltyProgram.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Order relationships
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Order.hasOne(Delivery, { foreignKey: 'orderId', as: 'delivery', onDelete: 'CASCADE' });
Delivery.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasOne(Review, { foreignKey: 'orderId', as: 'review' });
Review.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasMany(PromoCodeUsage, { foreignKey: 'orderId', as: 'promoCodeUsages' });
PromoCodeUsage.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasMany(LoyaltyTransaction, { foreignKey: 'orderId', as: 'loyaltyTransactions' });
LoyaltyTransaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasMany(Notification, { foreignKey: 'orderId', as: 'notifications' });
Notification.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// MenuItem relationships
MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId', as: 'orderItems' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId', as: 'menuItem' });

MenuItem.hasMany(Review, { foreignKey: 'menuItemId', as: 'reviews' });
Review.belongsTo(MenuItem, { foreignKey: 'menuItemId', as: 'menuItem' });

// Restaurant relationships
Restaurant.hasMany(MenuItem, { foreignKey: 'restaurantId', as: 'menuItems' });
MenuItem.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

Restaurant.hasMany(Order, { foreignKey: 'restaurantId', as: 'orders' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

Restaurant.hasMany(Review, { foreignKey: 'restaurantId', as: 'reviews' });
Review.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

// PromoCode relationships
PromoCode.hasMany(PromoCodeUsage, { foreignKey: 'promoCodeId', as: 'usages' });
PromoCodeUsage.belongsTo(PromoCode, { foreignKey: 'promoCodeId', as: 'promoCode' });

User.hasMany(PromoCodeUsage, { foreignKey: 'customerId', as: 'promoCodeUsages' });
PromoCodeUsage.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

// Loyalty Program relationships
LoyaltyProgram.hasMany(LoyaltyTransaction, { foreignKey: 'loyaltyProgramId', as: 'transactions' });
LoyaltyTransaction.belongsTo(LoyaltyProgram, { foreignKey: 'loyaltyProgramId', as: 'loyaltyProgram' });

// Driver reviews
User.hasMany(Review, { foreignKey: 'driverId', as: 'driverReviews' });
Review.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

module.exports = {
  sequelize,
  User,
  MenuItem,
  Order,
  OrderItem,
  Delivery,
  Payment,
  Review,
  PromoCode,
  PromoCodeUsage,
  Restaurant,
  LoyaltyProgram,
  LoyaltyTransaction,
  Notification
};
