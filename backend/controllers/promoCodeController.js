const { PromoCode, PromoCodeUsage, Order, User } = require('../models');
const { Op } = require('sequelize');

exports.createPromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      maxUsageCount,
      maxUsagePerCustomer,
      validFrom,
      validUntil,
      applicableToRestaurants,
      applicableToCategories,
      customerRestrictions
    } = req.body;

    // Check if code already exists
    const existingCode = await PromoCode.findOne({ where: { code: code.toUpperCase() } });
    if (existingCode) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }

    const promoCode = await PromoCode.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      maxUsageCount,
      maxUsagePerCustomer: maxUsagePerCustomer || 1,
      validFrom,
      validUntil,
      applicableToRestaurants: applicableToRestaurants ? JSON.stringify(applicableToRestaurants) : null,
      applicableToCategories: applicableToCategories ? JSON.stringify(applicableToCategories) : null,
      customerRestrictions: customerRestrictions ? JSON.stringify(customerRestrictions) : null,
      isActive: true
    });

    res.status(201).json({
      message: 'Promo code created successfully',
      promoCode
    });
  } catch (error) {
    console.error('Create promo code error:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
};

exports.validatePromoCode = async (req, res) => {
  try {
    const { code, orderAmount, restaurantId } = req.body;

    const promoCode = await PromoCode.findOne({
      where: {
        code: code.toUpperCase(),
        isActive: true
      }
    });

    if (!promoCode) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }

    // Check validity period
    const now = new Date();
    if (now < new Date(promoCode.validFrom) || now > new Date(promoCode.validUntil)) {
      return res.status(400).json({ error: 'Promo code has expired or not yet valid' });
    }

    // Check minimum order amount
    if (orderAmount < promoCode.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order amount of ${promoCode.minOrderAmount} required`,
        minOrderAmount: promoCode.minOrderAmount
      });
    }

    // Check max usage count
    if (promoCode.maxUsageCount && promoCode.currentUsageCount >= promoCode.maxUsageCount) {
      return res.status(400).json({ error: 'Promo code usage limit reached' });
    }

    // Check customer usage count
    const customerUsageCount = await PromoCodeUsage.count({
      where: {
        promoCodeId: promoCode.id,
        customerId: req.user.id
      }
    });

    if (customerUsageCount >= promoCode.maxUsagePerCustomer) {
      return res.status(400).json({ error: 'You have already used this promo code' });
    }

    // Check restaurant restrictions
    if (promoCode.applicableToRestaurants) {
      const applicableRestaurants = JSON.parse(promoCode.applicableToRestaurants);
      if (!applicableRestaurants.includes(restaurantId)) {
        return res.status(400).json({ error: 'Promo code not valid for this restaurant' });
      }
    }

    // Check customer restrictions
    if (promoCode.customerRestrictions) {
      const allowedCustomers = JSON.parse(promoCode.customerRestrictions);
      if (!allowedCustomers.includes(req.user.id)) {
        return res.status(400).json({ error: 'This promo code is not available for you' });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (promoCode.discountType === 'percentage') {
      discountAmount = (orderAmount * promoCode.discountValue) / 100;
      if (promoCode.maxDiscountAmount && discountAmount > promoCode.maxDiscountAmount) {
        discountAmount = parseFloat(promoCode.maxDiscountAmount);
      }
    } else if (promoCode.discountType === 'fixed_amount') {
      discountAmount = parseFloat(promoCode.discountValue);
    }

    res.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        discountAmount: discountAmount.toFixed(2),
        freeDelivery: promoCode.discountType === 'free_delivery'
      }
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
};

exports.getPromoCodes = async (req, res) => {
  try {
    const { isActive } = req.query;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const promoCodes = await PromoCode.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({ promoCodes });
  } catch (error) {
    console.error('Get promo codes error:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
};

exports.getActivePromoCodes = async (req, res) => {
  try {
    const now = new Date();

    const promoCodes = await PromoCode.findAll({
      where: {
        isActive: true,
        validFrom: { [Op.lte]: now },
        validUntil: { [Op.gte]: now },
        [Op.or]: [
          { maxUsageCount: null },
          { currentUsageCount: { [Op.lt]: sequelize.col('maxUsageCount') } }
        ]
      },
      attributes: ['code', 'description', 'discountType', 'discountValue', 'minOrderAmount', 'validUntil']
    });

    res.json({ promoCodes });
  } catch (error) {
    console.error('Get active promo codes error:', error);
    res.status(500).json({ error: 'Failed to fetch active promo codes' });
  }
};

exports.updatePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByPk(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    await promoCode.update(req.body);

    res.json({
      message: 'Promo code updated successfully',
      promoCode
    });
  } catch (error) {
    console.error('Update promo code error:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
};

exports.deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByPk(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    await promoCode.update({ isActive: false });

    res.json({ message: 'Promo code deactivated successfully' });
  } catch (error) {
    console.error('Delete promo code error:', error);
    res.status(500).json({ error: 'Failed to deactivate promo code' });
  }
};

exports.getPromoCodeUsage = async (req, res) => {
  try {
    const usages = await PromoCodeUsage.findAll({
      where: { promoCodeId: req.params.id },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName'] },
        { model: Order, as: 'order', attributes: ['id', 'totalAmount', 'createdAt'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ usages });
  } catch (error) {
    console.error('Get promo code usage error:', error);
    res.status(500).json({ error: 'Failed to fetch promo code usage' });
  }
};
