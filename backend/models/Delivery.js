const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  pickupTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currentLocation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string of lat/lng'
  },
  locationHistory: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of location updates with timestamps'
  },
  estimatedArrival: {
    type: DataTypes.DATE,
    allowNull: true
  },
  distance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Distance in kilometers'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Delivery;
