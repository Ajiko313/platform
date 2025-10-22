const { Order, User, MenuItem, Restaurant, Review, Payment, Delivery } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate, restaurantId } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate);
    if (endDate) dateFilter[Op.lte] = new Date(endDate);

    const orderWhere = {};
    if (Object.keys(dateFilter).length > 0) {
      orderWhere.createdAt = dateFilter;
    }
    if (restaurantId) {
      orderWhere.restaurantId = restaurantId;
    }

    // Total orders
    const totalOrders = await Order.count({ where: orderWhere });

    // Orders by status
    const ordersByStatus = await Order.findAll({
      where: orderWhere,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Total revenue
    const totalRevenue = await Order.sum('totalAmount', {
      where: {
        ...orderWhere,
        status: 'delivered'
      }
    });

    // Average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Total customers
    const totalCustomers = await User.count({
      where: { role: 'customer', isActive: true }
    });

    // Active delivery drivers
    const activeDrivers = await User.count({
      where: { role: 'delivery', isActive: true }
    });

    // Top selling items
    const topSellingItems = await sequelize.query(`
      SELECT 
        mi.id,
        mi.name,
        mi.category,
        COUNT(oi.id) as order_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM MenuItems mi
      JOIN OrderItems oi ON mi.id = oi.menuItemId
      JOIN Orders o ON oi.orderId = o.id
      WHERE o.status = 'delivered'
      ${restaurantId ? `AND mi.restaurantId = ${restaurantId}` : ''}
      GROUP BY mi.id, mi.name, mi.category
      ORDER BY total_quantity DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    // Revenue by day (last 30 days)
    const revenueByDay = await sequelize.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(id) as order_count,
        SUM(totalAmount) as revenue
      FROM Orders
      WHERE status = 'delivered'
        AND createdAt >= DATE('now', '-30 days')
        ${restaurantId ? `AND restaurantId = ${restaurantId}` : ''}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `, { type: sequelize.QueryTypes.SELECT });

    // Customer retention metrics
    const repeatCustomers = await sequelize.query(`
      SELECT COUNT(DISTINCT customerId) as count
      FROM Orders
      WHERE customerId IN (
        SELECT customerId
        FROM Orders
        GROUP BY customerId
        HAVING COUNT(id) > 1
      )
    `, { type: sequelize.QueryTypes.SELECT });

    // Average delivery time
    const avgDeliveryTime = await sequelize.query(`
      SELECT AVG(
        (julianday(actualDeliveryTime) - julianday(createdAt)) * 24 * 60
      ) as avg_minutes
      FROM Orders
      WHERE actualDeliveryTime IS NOT NULL
        AND status = 'delivered'
        ${restaurantId ? `AND restaurantId = ${restaurantId}` : ''}
    `, { type: sequelize.QueryTypes.SELECT });

    // Reviews summary
    const reviewStats = await Review.findAll({
      where: restaurantId ? { restaurantId } : {},
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
        [sequelize.fn('AVG', sequelize.col('foodRating')), 'avgFoodRating'],
        [sequelize.fn('AVG', sequelize.col('deliveryRating')), 'avgDeliveryRating']
      ]
    });

    res.json({
      stats: {
        totalOrders,
        totalRevenue: totalRevenue || 0,
        averageOrderValue: averageOrderValue.toFixed(2),
        totalCustomers,
        activeDrivers,
        repeatCustomers: repeatCustomers[0]?.count || 0,
        avgDeliveryTime: avgDeliveryTime[0]?.avg_minutes?.toFixed(1) || 0,
        ordersByStatus,
        topSellingItems,
        revenueByDay,
        reviewStats: reviewStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findByPk(customerId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt']
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const totalOrders = await Order.count({
      where: { customerId }
    });

    const totalSpent = await Order.sum('totalAmount', {
      where: {
        customerId,
        status: 'delivered'
      }
    });

    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    const favoriteItems = await sequelize.query(`
      SELECT 
        mi.id,
        mi.name,
        COUNT(oi.id) as order_count
      FROM MenuItems mi
      JOIN OrderItems oi ON mi.id = oi.menuItemId
      JOIN Orders o ON oi.orderId = o.id
      WHERE o.customerId = ${customerId}
      GROUP BY mi.id, mi.name
      ORDER BY order_count DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    const recentOrders = await Order.findAll({
      where: { customerId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      customer,
      analytics: {
        totalOrders,
        totalSpent: totalSpent || 0,
        averageOrderValue: averageOrderValue.toFixed(2),
        favoriteItems,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
};

exports.getDriverAnalytics = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await User.findByPk(driverId, {
      attributes: ['id', 'firstName', 'lastName', 'phone', 'rating', 'totalDeliveries']
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const totalDeliveries = await Delivery.count({
      where: {
        driverId,
        status: 'delivered'
      }
    });

    const avgDeliveryTime = await sequelize.query(`
      SELECT AVG(
        (julianday(deliveryTime) - julianday(pickupTime)) * 24 * 60
      ) as avg_minutes
      FROM Deliveries
      WHERE driverId = ${driverId}
        AND status = 'delivered'
        AND pickupTime IS NOT NULL
        AND deliveryTime IS NOT NULL
    `, { type: sequelize.QueryTypes.SELECT });

    const deliveriesByDay = await sequelize.query(`
      SELECT 
        DATE(deliveryTime) as date,
        COUNT(id) as delivery_count
      FROM Deliveries
      WHERE driverId = ${driverId}
        AND status = 'delivered'
        AND deliveryTime >= DATE('now', '-30 days')
      GROUP BY DATE(deliveryTime)
      ORDER BY date DESC
    `, { type: sequelize.QueryTypes.SELECT });

    const totalEarnings = await sequelize.query(`
      SELECT SUM(o.deliveryFee) as total
      FROM Orders o
      JOIN Deliveries d ON o.id = d.orderId
      WHERE d.driverId = ${driverId}
        AND d.status = 'delivered'
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({
      driver,
      analytics: {
        totalDeliveries,
        avgDeliveryTime: avgDeliveryTime[0]?.avg_minutes?.toFixed(1) || 0,
        deliveriesByDay,
        totalEarnings: totalEarnings[0]?.total || 0,
        rating: driver.rating
      }
    });
  } catch (error) {
    console.error('Get driver analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch driver analytics' });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {
    const { period, restaurantId } = req.query; // period: day, week, month, year

    let dateFormat = '%Y-%m-%d';
    let groupByPeriod = "DATE(createdAt)";

    if (period === 'week') {
      groupByPeriod = "strftime('%Y-W%W', createdAt)";
    } else if (period === 'month') {
      groupByPeriod = "strftime('%Y-%m', createdAt)";
    } else if (period === 'year') {
      groupByPeriod = "strftime('%Y', createdAt)";
    }

    const revenueData = await sequelize.query(`
      SELECT 
        ${groupByPeriod} as period,
        COUNT(id) as order_count,
        SUM(totalAmount) as total_revenue,
        SUM(deliveryFee) as delivery_revenue,
        AVG(totalAmount) as avg_order_value
      FROM Orders
      WHERE status = 'delivered'
        ${restaurantId ? `AND restaurantId = ${restaurantId}` : ''}
      GROUP BY ${groupByPeriod}
      ORDER BY period DESC
      LIMIT 30
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({ revenueData });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue report' });
  }
};
