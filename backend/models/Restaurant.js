const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Restaurant = sequelize.define('Restaurant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cuisineType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 5.0
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  openingTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  closingTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  deliveryRadius: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 10.0,
    comment: 'Delivery radius in kilometers'
  },
  minimumOrder: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 5.00
  },
  estimatedDeliveryTime: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Estimated delivery time in minutes'
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string of lat/lng'
  }
});

module.exports = Restaurant;
