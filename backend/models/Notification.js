const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
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
    type: DataTypes.ENUM('email', 'sms', 'push', 'telegram', 'in_app'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'),
    defaultValue: 'pending'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string for additional notification data'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Notification;
