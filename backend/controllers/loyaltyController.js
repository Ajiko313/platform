const { LoyaltyProgram, LoyaltyTransaction, User } = require('../models');

const POINTS_PER_DOLLAR = 10;
const DOLLAR_PER_POINT = 0.01;

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000
};

const TIER_MULTIPLIERS = {
  bronze: 1,
  silver: 1.25,
  gold: 1.5,
  platinum: 2
};

exports.getLoyaltyProgram = async (req, res) => {
  try {
    let loyaltyProgram = await LoyaltyProgram.findOne({
      where: { customerId: req.user.id },
      include: [
        {
          model: LoyaltyTransaction,
          as: 'transactions',
          limit: 20,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!loyaltyProgram) {
      // Create loyalty program if doesn't exist
      loyaltyProgram = await LoyaltyProgram.create({
        customerId: req.user.id
      });
    }

    res.json({ loyaltyProgram });
  } catch (error) {
    console.error('Get loyalty program error:', error);
    res.status(500).json({ error: 'Failed to fetch loyalty program' });
  }
};

exports.calculatePoints = (orderAmount, tier = 'bronze') => {
  const multiplier = TIER_MULTIPLIERS[tier] || 1;
  return Math.floor(orderAmount * POINTS_PER_DOLLAR * multiplier);
};

exports.earnPoints = async (customerId, orderId, orderAmount) => {
  try {
    let loyaltyProgram = await LoyaltyProgram.findOne({
      where: { customerId }
    });

    if (!loyaltyProgram) {
      loyaltyProgram = await LoyaltyProgram.create({ customerId });
    }

    const points = exports.calculatePoints(orderAmount, loyaltyProgram.tier);

    await LoyaltyTransaction.create({
      loyaltyProgramId: loyaltyProgram.id,
      orderId,
      type: 'earned',
      points,
      description: `Earned ${points} points from order`,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
    });

    const newPoints = loyaltyProgram.points + points;
    const newTotalEarned = loyaltyProgram.totalPointsEarned + points;

    // Determine tier based on total points earned
    let newTier = 'bronze';
    if (newTotalEarned >= TIER_THRESHOLDS.platinum) {
      newTier = 'platinum';
    } else if (newTotalEarned >= TIER_THRESHOLDS.gold) {
      newTier = 'gold';
    } else if (newTotalEarned >= TIER_THRESHOLDS.silver) {
      newTier = 'silver';
    }

    await loyaltyProgram.update({
      points: newPoints,
      totalPointsEarned: newTotalEarned,
      tier: newTier,
      lastPointsEarnedAt: new Date()
    });

    return { points, newTier: newTier !== loyaltyProgram.tier ? newTier : null };
  } catch (error) {
    console.error('Earn points error:', error);
    throw error;
  }
};

exports.redeemPoints = async (req, res) => {
  try {
    const { points, orderId } = req.body;

    const loyaltyProgram = await LoyaltyProgram.findOne({
      where: { customerId: req.user.id }
    });

    if (!loyaltyProgram) {
      return res.status(404).json({ error: 'Loyalty program not found' });
    }

    if (points > loyaltyProgram.points) {
      return res.status(400).json({
        error: 'Insufficient points',
        availablePoints: loyaltyProgram.points
      });
    }

    if (points < 100) {
      return res.status(400).json({ error: 'Minimum 100 points required for redemption' });
    }

    const discountAmount = points * DOLLAR_PER_POINT;

    await LoyaltyTransaction.create({
      loyaltyProgramId: loyaltyProgram.id,
      orderId,
      type: 'redeemed',
      points: -points,
      description: `Redeemed ${points} points for $${discountAmount.toFixed(2)} discount`
    });

    await loyaltyProgram.update({
      points: loyaltyProgram.points - points,
      totalPointsRedeemed: loyaltyProgram.totalPointsRedeemed + points,
      lastPointsRedeemedAt: new Date()
    });

    res.json({
      message: 'Points redeemed successfully',
      pointsRedeemed: points,
      discountAmount: discountAmount.toFixed(2),
      remainingPoints: loyaltyProgram.points - points
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(500).json({ error: 'Failed to redeem points' });
  }
};

exports.getLoyaltyTransactions = async (req, res) => {
  try {
    const loyaltyProgram = await LoyaltyProgram.findOne({
      where: { customerId: req.user.id }
    });

    if (!loyaltyProgram) {
      return res.json({ transactions: [] });
    }

    const transactions = await LoyaltyTransaction.findAll({
      where: { loyaltyProgramId: loyaltyProgram.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Get loyalty transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch loyalty transactions' });
  }
};

exports.addBonusPoints = async (req, res) => {
  try {
    const { customerId, points, description } = req.body;

    let loyaltyProgram = await LoyaltyProgram.findOne({
      where: { customerId }
    });

    if (!loyaltyProgram) {
      loyaltyProgram = await LoyaltyProgram.create({ customerId });
    }

    await LoyaltyTransaction.create({
      loyaltyProgramId: loyaltyProgram.id,
      type: 'bonus',
      points,
      description: description || 'Bonus points',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });

    await loyaltyProgram.update({
      points: loyaltyProgram.points + points,
      totalPointsEarned: loyaltyProgram.totalPointsEarned + points
    });

    res.json({
      message: 'Bonus points added successfully',
      loyaltyProgram
    });
  } catch (error) {
    console.error('Add bonus points error:', error);
    res.status(500).json({ error: 'Failed to add bonus points' });
  }
};
