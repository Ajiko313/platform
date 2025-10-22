const express = require('express');
const { body, query } = require('express-validator');
const restaurantController = require('../controllers/restaurantController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('address').notEmpty().trim(),
    body('phone').notEmpty().trim(),
    body('email').optional().isEmail(),
    body('cuisineType').optional().trim(),
    body('deliveryRadius').optional().isFloat({ min: 0 }),
    body('minimumOrder').optional().isFloat({ min: 0 }),
    body('deliveryFee').optional().isFloat({ min: 0 }),
    body('estimatedDeliveryTime').optional().isInt({ min: 1 }),
    validate
  ],
  restaurantController.createRestaurant
);

router.get('/',
  [
    query('isActive').optional().isBoolean(),
    query('cuisineType').optional().trim(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    validate
  ],
  restaurantController.getRestaurants
);

router.get('/:id', restaurantController.getRestaurant);

router.get('/:id/stats', authenticate, authorize('admin'), restaurantController.getRestaurantStats);

router.patch('/:id',
  authenticate,
  authorize('admin'),
  restaurantController.updateRestaurant
);

router.delete('/:id', authenticate, authorize('admin'), restaurantController.deleteRestaurant);

module.exports = router;
