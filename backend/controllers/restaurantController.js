const { Restaurant, MenuItem, Review, Order } = require('../models');
const { Op } = require('sequelize');

exports.createRestaurant = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      phone,
      email,
      imageUrl,
      cuisineType,
      openingTime,
      closingTime,
      deliveryRadius,
      minimumOrder,
      deliveryFee,
      estimatedDeliveryTime,
      location
    } = req.body;

    const restaurant = await Restaurant.create({
      name,
      description,
      address,
      phone,
      email,
      imageUrl,
      cuisineType,
      openingTime,
      closingTime,
      deliveryRadius: deliveryRadius || 10.0,
      minimumOrder: minimumOrder || 0,
      deliveryFee: deliveryFee || 5.00,
      estimatedDeliveryTime: estimatedDeliveryTime || 30,
      location: location ? JSON.stringify(location) : null,
      isActive: true
    });

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
};

exports.getRestaurants = async (req, res) => {
  try {
    const { isActive, cuisineType, minRating } = req.query;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (cuisineType) {
      where.cuisineType = cuisineType;
    }

    if (minRating) {
      where.rating = { [Op.gte]: minRating };
    }

    const restaurants = await Restaurant.findAll({
      where,
      include: [
        {
          model: MenuItem,
          as: 'menuItems',
          where: { isAvailable: true },
          required: false
        }
      ],
      order: [['rating', 'DESC'], ['name', 'ASC']]
    });

    res.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [
        {
          model: MenuItem,
          as: 'menuItems',
          where: { isAvailable: true },
          required: false
        },
        {
          model: Review,
          as: 'reviews',
          where: { isPublic: true },
          required: false,
          include: [{ model: User, as: 'customer', attributes: ['firstName', 'lastName'] }],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    await restaurant.update(req.body);

    res.json({
      message: 'Restaurant updated successfully',
      restaurant
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    await restaurant.update({ isActive: false });

    res.json({ message: 'Restaurant deactivated successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ error: 'Failed to deactivate restaurant' });
  }
};

exports.getRestaurantStats = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const totalOrders = await Order.count({
      where: { restaurantId: req.params.id }
    });

    const totalRevenue = await Order.sum('totalAmount', {
      where: {
        restaurantId: req.params.id,
        status: 'delivered'
      }
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const popularItems = await MenuItem.findAll({
      where: { restaurantId: req.params.id },
      order: [['totalReviews', 'DESC'], ['rating', 'DESC']],
      limit: 5
    });

    res.json({
      stats: {
        totalOrders,
        totalRevenue: totalRevenue || 0,
        averageOrderValue: averageOrderValue.toFixed(2),
        rating: restaurant.rating,
        totalReviews: restaurant.totalReviews,
        popularItems
      }
    });
  } catch (error) {
    console.error('Get restaurant stats error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant stats' });
  }
};
