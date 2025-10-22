const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  method: {
    type: DataTypes.ENUM('card', 'telegram_stars', 'cash'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment gateway transaction ID'
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string for additional payment data'
  }
});

module.exports = Payment;
