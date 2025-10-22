const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoyaltyProgram = sequelize.define('LoyaltyProgram', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  totalPointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalPointsRedeemed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tier: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
    defaultValue: 'bronze'
  },
  lastPointsEarnedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastPointsRedeemedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = LoyaltyProgram;
