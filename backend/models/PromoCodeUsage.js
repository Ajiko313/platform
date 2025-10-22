const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PromoCodeUsage = sequelize.define('PromoCodeUsage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  promoCodeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'PromoCodes',
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = PromoCodeUsage;
