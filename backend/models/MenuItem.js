const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Restaurants',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preparationTime: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    comment: 'Preparation time in minutes'
  },
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 5.0
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = MenuItem;
