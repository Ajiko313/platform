const { Review, Order, User, MenuItem, Restaurant } = require('../models');
const { Op } = require('sequelize');

exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, foodRating, deliveryRating, comment, menuItemId } = req.body;

    // Check if order exists and belongs to user
    const order = await Order.findByPk(orderId, {
      include: [{ model: Delivery, as: 'delivery' }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Can only review delivered orders' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ where: { orderId } });
    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this order' });
    }

    // Create review
    const review = await Review.create({
      orderId,
      customerId: req.user.id,
      menuItemId: menuItemId || null,
      driverId: order.delivery ? order.delivery.driverId : null,
      restaurantId: order.restaurantId,
      rating,
      foodRating: foodRating || rating,
      deliveryRating: deliveryRating || rating,
      comment
    });

    // Update driver rating if applicable
    if (order.delivery && order.delivery.driverId) {
      const driver = await User.findByPk(order.delivery.driverId);
      const driverReviews = await Review.findAll({
        where: { driverId: driver.id }
      });
      const avgRating = driverReviews.reduce((sum, r) => sum + r.deliveryRating, 0) / driverReviews.length;
      await driver.update({ rating: avgRating.toFixed(1) });
    }

    // Update menu item rating if applicable
    if (menuItemId) {
      const menuItem = await MenuItem.findByPk(menuItemId);
      const itemReviews = await Review.findAll({
        where: { menuItemId }
      });
      const avgRating = itemReviews.reduce((sum, r) => sum + r.foodRating, 0) / itemReviews.length;
      await menuItem.update({
        rating: avgRating.toFixed(1),
        totalReviews: itemReviews.length
      });
    }

    // Update restaurant rating if applicable
    if (order.restaurantId) {
      const restaurant = await Restaurant.findByPk(order.restaurantId);
      const restaurantReviews = await Review.findAll({
        where: { restaurantId: order.restaurantId }
      });
      const avgRating = restaurantReviews.reduce((sum, r) => sum + r.rating, 0) / restaurantReviews.length;
      await restaurant.update({
        rating: avgRating.toFixed(1),
        totalReviews: restaurantReviews.length
      });
    }

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { menuItemId, restaurantId, driverId, minRating } = req.query;
    const where = { isPublic: true };

    if (menuItemId) where.menuItemId = menuItemId;
    if (restaurantId) where.restaurantId = restaurantId;
    if (driverId) where.driverId = driverId;
    if (minRating) where.rating = { [Op.gte]: minRating };

    const reviews = await Review.findAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName'] },
        { model: MenuItem, as: 'menuItem', attributes: ['id', 'name'] },
        { model: Restaurant, as: 'restaurant', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, foodRating, deliveryRating, comment, isPublic } = req.body;

    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.customerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await review.update({
      rating: rating !== undefined ? rating : review.rating,
      foodRating: foodRating !== undefined ? foodRating : review.foodRating,
      deliveryRating: deliveryRating !== undefined ? deliveryRating : review.deliveryRating,
      comment: comment !== undefined ? comment : review.comment,
      isPublic: isPublic !== undefined ? isPublic : review.isPublic
    });

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

exports.addAdminResponse = async (req, res) => {
  try {
    const { adminResponse } = req.body;

    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.update({
      adminResponse,
      adminResponseAt: new Date()
    });

    res.json({
      message: 'Admin response added successfully',
      review
    });
  } catch (error) {
    console.error('Add admin response error:', error);
    res.status(500).json({ error: 'Failed to add admin response' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.customerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await review.destroy();

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
