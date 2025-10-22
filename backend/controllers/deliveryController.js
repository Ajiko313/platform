const { Delivery, Order, User, OrderItem, MenuItem } = require('../models');
const { notifyDeliveryUpdate } = require('../services/notificationService');

exports.getAvailableDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: Order,
          as: 'order',
          where: { status: 'ready' },
          include: [
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: MenuItem, as: 'menuItem' }]
            },
            { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] }
          ]
        }
      ]
    });

    res.json({ deliveries });
  } catch (error) {
    console.error('Get available deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch available deliveries' });
  }
};

exports.getMyDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { driverId: req.user.id };
    
    if (status) {
      where.status = status;
    }

    const deliveries = await Delivery.findAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: MenuItem, as: 'menuItem' }]
            },
            { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ deliveries });
  } catch (error) {
    console.error('Get my deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
};

exports.acceptDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id, {
      include: [{ model: Order, as: 'order' }]
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Delivery is not available',
        currentStatus: delivery.status
      });
    }

    await delivery.update({
      driverId: req.user.id,
      status: 'assigned'
    });

    await delivery.order.update({ status: 'out_for_delivery' });

    const updatedDelivery = await Delivery.findByPk(delivery.id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: MenuItem, as: 'menuItem' }]
            },
            { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] }
          ]
        },
        { model: User, as: 'driver', attributes: ['id', 'firstName', 'lastName', 'phone'] }
      ]
    });

    await notifyDeliveryUpdate(updatedDelivery, 'accepted');

    res.json({
      message: 'Delivery accepted successfully',
      delivery: updatedDelivery
    });
  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({ error: 'Failed to accept delivery' });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status, currentLocation, notes } = req.body;

    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Authorization check
    if (delivery.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (currentLocation) updateData.currentLocation = JSON.stringify(currentLocation);
    if (notes) updateData.notes = notes;

    if (status === 'picked_up') {
      updateData.pickupTime = new Date();
    } else if (status === 'delivered') {
      updateData.deliveryTime = new Date();
      
      // Update order status
      const order = await Order.findByPk(delivery.orderId);
      await order.update({ 
        status: 'delivered',
        actualDeliveryTime: new Date()
      });

      // Update driver stats
      await req.user.increment('totalDeliveries');
    }

    await delivery.update(updateData);

    const updatedDelivery = await Delivery.findByPk(delivery.id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: MenuItem, as: 'menuItem' }]
            },
            { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] }
          ]
        },
        { model: User, as: 'driver', attributes: ['id', 'firstName', 'lastName', 'phone', 'rating', 'totalDeliveries'] }
      ]
    });

    await notifyDeliveryUpdate(updatedDelivery, `status_${status}`);

    res.json({
      message: 'Delivery status updated successfully',
      delivery: updatedDelivery
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
};

exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: MenuItem, as: 'menuItem' }]
            },
            { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] }
          ]
        },
        { model: User, as: 'driver', attributes: ['id', 'firstName', 'lastName', 'phone', 'rating'] }
      ]
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json({ delivery });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
};
