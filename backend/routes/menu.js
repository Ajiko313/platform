const express = require('express');
const { body } = require('express-validator');
const menuController = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get('/', menuController.getAllItems);

router.get('/categories', menuController.getCategories);

router.get('/:id', menuController.getItem);

router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('name').notEmpty().trim(),
    body('price').isFloat({ min: 0 }),
    body('category').notEmpty().trim(),
    validate
  ],
  menuController.createItem
);

router.put('/:id',
  authenticate,
  authorize('admin'),
  menuController.updateItem
);

router.delete('/:id',
  authenticate,
  authorize('admin'),
  menuController.deleteItem
);

module.exports = router;
