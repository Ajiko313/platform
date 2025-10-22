const { MenuItem } = require('../models');

exports.getAllItems = async (req, res) => {
  try {
    const { category, available } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (available !== undefined) where.isAvailable = available === 'true';

    const items = await MenuItem.findAll({ where });

    res.json({ items });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

exports.getItem = async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, preparationTime, ingredients } = req.body;

    const item = await MenuItem.create({
      name,
      description,
      price,
      category,
      imageUrl,
      preparationTime,
      ingredients
    });

    res.status(201).json({
      message: 'Menu item created successfully',
      item
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const { name, description, price, category, imageUrl, isAvailable, preparationTime, ingredients } = req.body;

    await item.update({
      name: name !== undefined ? name : item.name,
      description: description !== undefined ? description : item.description,
      price: price !== undefined ? price : item.price,
      category: category !== undefined ? category : item.category,
      imageUrl: imageUrl !== undefined ? imageUrl : item.imageUrl,
      isAvailable: isAvailable !== undefined ? isAvailable : item.isAvailable,
      preparationTime: preparationTime !== undefined ? preparationTime : item.preparationTime,
      ingredients: ingredients !== undefined ? ingredients : item.ingredients
    });

    res.json({
      message: 'Menu item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    await item.destroy();

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await MenuItem.findAll({
      attributes: ['category'],
      group: ['category']
    });

    res.json({ 
      categories: categories.map(c => c.category) 
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};
