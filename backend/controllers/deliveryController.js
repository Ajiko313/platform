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

// GPS Tracking - Update driver location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const location = { latitude, longitude, timestamp: new Date() };
    
    // Update current location
    await delivery.update({
      currentLocation: JSON.stringify(location)
    });

    // Add to location history
    let locationHistory = [];
    if (delivery.locationHistory) {
      locationHistory = JSON.parse(delivery.locationHistory);
    }
    locationHistory.push(location);
    
    // Keep only last 100 location points
    if (locationHistory.length > 100) {
      locationHistory = locationHistory.slice(-100);
    }
    
    await delivery.update({
      locationHistory: JSON.stringify(locationHistory)
    });

    // Emit location update via Socket.IO
    const io = require('../socket');
    if (io.instance) {
      io.instance.emit('delivery:location_update', {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        location
      });

      // Notify customer
      const order = await Order.findByPk(delivery.orderId);
      if (order) {
        io.instance.to(`user:${order.customerId}`).emit('driver:location', {
          deliveryId: delivery.id,
          location
        });
      }
    }

    res.json({
      message: 'Location updated successfully',
      location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Get delivery location tracking
exports.getDeliveryTracking = async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'customerId', 'deliveryAddress']
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }
      ]
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Check authorization - customer or driver can view
    const isAuthorized = 
      req.user.role === 'admin' ||
      delivery.driverId === req.user.id ||
      delivery.order.customerId === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const currentLocation = delivery.currentLocation ? JSON.parse(delivery.currentLocation) : null;
    const locationHistory = delivery.locationHistory ? JSON.parse(delivery.locationHistory) : [];

    res.json({
      delivery: {
        id: delivery.id,
        status: delivery.status,
        currentLocation,
        locationHistory,
        estimatedArrival: delivery.estimatedArrival,
        distance: delivery.distance,
        driver: delivery.driver
      }
    });
  } catch (error) {
    console.error('Get delivery tracking error:', error);
    res.status(500).json({ error: 'Failed to fetch delivery tracking' });
  }
};

// Calculate estimated arrival time
exports.updateEstimatedArrival = async (req, res) => {
  try {
    const { estimatedMinutes, distance } = req.body;
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.driverId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const estimatedArrival = new Date(Date.now() + estimatedMinutes * 60000);

    await delivery.update({
      estimatedArrival,
      distance: distance || delivery.distance
    });

    // Notify customer
    const io = require('../socket');
    if (io.instance) {
      const order = await Order.findByPk(delivery.orderId);
      if (order) {
        io.instance.to(`user:${order.customerId}`).emit('delivery:eta_update', {
          deliveryId: delivery.id,
          estimatedArrival,
          estimatedMinutes
        });
      }
    }

    res.json({
      message: 'Estimated arrival updated successfully',
      estimatedArrival,
      estimatedMinutes
    });
  } catch (error) {
    console.error('Update estimated arrival error:', error);
    res.status(500).json({ error: 'Failed to update estimated arrival' });
  }
};
