const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PromoCode = sequelize.define('PromoCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'fixed_amount', 'free_delivery'),
    allowNull: false
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  maxDiscountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  maxUsageCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  currentUsageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxUsagePerCustomer: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  validFrom: {
    type: DataTypes.DATE,
    allowNull: false
  },
  validUntil: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  applicableToRestaurants: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of restaurant IDs, null means all restaurants'
  },
  applicableToCategories: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of category names, null means all categories'
  },
  customerRestrictions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of customer IDs, null means all customers'
  }
});

module.exports = PromoCode;
