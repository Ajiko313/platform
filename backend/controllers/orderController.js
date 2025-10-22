const { Order, OrderItem, MenuItem, User, Delivery } = require('../models');
const { notifyOrderUpdate } = require('../services/notificationService');

const VALID_STATUS_TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

exports.createOrder = async (req, res) => {
  try {
    const { 
      items, 
      deliveryAddress, 
      deliveryInstructions, 
      customerPhone,
      promoCode,
      loyaltyPointsToUse,
      scheduledDeliveryTime,
      restaurantId 
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Validate all menu items exist and are available
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await MenuItem.findAll({
      where: { id: menuItemIds }
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'Some menu items not found' });
    }

    const unavailableItems = menuItems.filter(item => !item.isAvailable);
    if (unavailableItems.length > 0) {
      return res.status(400).json({ 
        error: 'Some items are not available',
        unavailableItems: unavailableItems.map(item => item.name)
      });
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems = items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions || null
      };
    });

    const deliveryFee = 5.00;
    totalAmount += deliveryFee;

    // Apply promo code if provided
    let promoCodeId = null;
    let discountAmount = 0;

    if (promoCode) {
      const { PromoCode, PromoCodeUsage } = require('../models');
      const promo = await PromoCode.findOne({
        where: { code: promoCode.toUpperCase(), isActive: true }
      });

      if (promo) {
        // Validate promo code
        const now = new Date();
        if (now >= new Date(promo.validFrom) && now <= new Date(promo.validUntil)) {
          if (totalAmount >= promo.minOrderAmount) {
            const usageCount = await PromoCodeUsage.count({
              where: { promoCodeId: promo.id, customerId: req.user.id }
            });

            if (usageCount < promo.maxUsagePerCustomer) {
              // Calculate discount
              if (promo.discountType === 'percentage') {
                discountAmount = (totalAmount * promo.discountValue) / 100;
                if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
                  discountAmount = parseFloat(promo.maxDiscountAmount);
                }
              } else if (promo.discountType === 'fixed_amount') {
                discountAmount = parseFloat(promo.discountValue);
              } else if (promo.discountType === 'free_delivery') {
                discountAmount = deliveryFee;
              }

              promoCodeId = promo.id;
              totalAmount -= discountAmount;
            }
          }
        }
      }
    }

    // Apply loyalty points if provided
    let loyaltyPointsUsed = 0;
    let loyaltyDiscount = 0;

    if (loyaltyPointsToUse && loyaltyPointsToUse > 0) {
      const { LoyaltyProgram } = require('../models');
      const loyaltyProgram = await LoyaltyProgram.findOne({
        where: { customerId: req.user.id }
      });

      if (loyaltyProgram && loyaltyProgram.points >= loyaltyPointsToUse) {
        loyaltyPointsUsed = loyaltyPointsToUse;
        loyaltyDiscount = loyaltyPointsToUse * 0.01; // 100 points = $1
        totalAmount -= loyaltyDiscount;
        discountAmount += loyaltyDiscount;
      }
    }

    // Calculate estimated delivery time
    const maxPrepTime = Math.max(...menuItems.map(item => item.preparationTime || 15));
    const estimatedDeliveryTime = scheduledDeliveryTime 
      ? new Date(scheduledDeliveryTime)
      : new Date(Date.now() + (maxPrepTime + 30) * 60000);

    // Create order
    const order = await Order.create({
      customerId: req.user.id,
      restaurantId: restaurantId || null,
      totalAmount,
      deliveryFee,
      deliveryAddress,
      deliveryInstructions,
      customerPhone,
      estimatedDeliveryTime,
      scheduledDeliveryTime: scheduledDeliveryTime || null,
      promoCodeId,
      discountAmount,
      loyaltyPointsUsed,
      status: scheduledDeliveryTime ? 'paid' : 'pending' // Auto-paid if scheduled
    });

    // Create order items
    const createdItems = await Promise.all(
      orderItems.map(item => 
        OrderItem.create({ ...item, orderId: order.id })
      )
    );

    // Record promo code usage if applied
    if (promoCodeId) {
      const { PromoCodeUsage, PromoCode } = require('../models');
      await PromoCodeUsage.create({
        promoCodeId,
        orderId: order.id,
        customerId: req.user.id,
        discountAmount
      });

      // Increment promo code usage count
      await PromoCode.increment('currentUsageCount', { where: { id: promoCodeId } });
    }

    // Deduct loyalty points if used
    if (loyaltyPointsUsed > 0) {
      const { LoyaltyProgram, LoyaltyTransaction } = require('../models');
      const loyaltyProgram = await LoyaltyProgram.findOne({
        where: { customerId: req.user.id }
      });

      await loyaltyProgram.update({
        points: loyaltyProgram.points - loyaltyPointsUsed,
        totalPointsRedeemed: loyaltyProgram.totalPointsRedeemed + loyaltyPointsUsed,
        lastPointsRedeemedAt: new Date()
      });

      await LoyaltyTransaction.create({
        loyaltyProgramId: loyaltyProgram.id,
        orderId: order.id,
        type: 'redeemed',
        points: -loyaltyPointsUsed,
        description: `Redeemed ${loyaltyPointsUsed} points for $${loyaltyDiscount.toFixed(2)} discount`
      });
    }

    // Create delivery record
    await Delivery.create({
      orderId: order.id,
      status: 'pending'
    });

    // Fetch complete order data
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] }
      ]
    });

    await notifyOrderUpdate(completeOrder, 'created');

    res.status(201).json({
      message: 'Order created successfully',
      order: completeOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (req.user.role === 'customer') {
      where.customerId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: Delivery, as: 'delivery' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { 
          model: Delivery, 
          as: 'delivery',
          include: [{ model: User, as: 'driver', attributes: ['id', 'firstName', 'lastName', 'phone'] }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Authorization check
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate status transition
    const validTransitions = VALID_STATUS_TRANSITIONS[order.status];
    if (!validTransitions.includes(status)) {
      return res.status(400).json({ 
        error: `Cannot transition from ${order.status} to ${status}`,
        currentStatus: order.status,
        allowedStatuses: validTransitions
      });
    }

    const oldStatus = order.status;
    await order.update({ status });

    // Update delivery status accordingly
    if (status === 'out_for_delivery') {
      const delivery = await Delivery.findOne({ where: { orderId: order.id } });
      if (delivery && delivery.status === 'pending') {
        await delivery.update({ status: 'assigned' });
      }
    } else if (status === 'delivered') {
      await order.update({ actualDeliveryTime: new Date() });

      // Award loyalty points for completed order
      const { earnPoints } = require('./loyaltyController');
      const result = await earnPoints(order.customerId, order.id, parseFloat(order.totalAmount));
      
      if (result) {
        await order.update({
          loyaltyPointsEarned: result.points
        });
      }
    }

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: Delivery, as: 'delivery' }
      ]
    });

    await notifyOrderUpdate(updatedOrder, `status_${oldStatus}_to_${status}`);

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Authorization check
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order can be cancelled
    if (!['pending', 'paid', 'preparing'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Order cannot be cancelled at this stage',
        currentStatus: order.status
      });
    }

    await order.update({ status: 'cancelled' });

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone'] }
      ]
    });

    await notifyOrderUpdate(updatedOrder, 'cancelled');

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};
