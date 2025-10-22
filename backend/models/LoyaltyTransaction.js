const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoyaltyTransaction = sequelize.define('LoyaltyTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  loyaltyProgramId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'LoyaltyPrograms',
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('earned', 'redeemed', 'expired', 'bonus'),
    allowNull: false
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = LoyaltyTransaction;
