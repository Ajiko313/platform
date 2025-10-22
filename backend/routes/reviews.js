const express = require('express');
const { body, query } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.post('/',
  authenticate,
  [
    body('orderId').isInt(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('foodRating').optional().isInt({ min: 1, max: 5 }),
    body('deliveryRating').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
    body('menuItemId').optional().isInt(),
    validate
  ],
  reviewController.createReview
);

router.get('/',
  [
    query('menuItemId').optional().isInt(),
    query('restaurantId').optional().isInt(),
    query('driverId').optional().isInt(),
    query('minRating').optional().isInt({ min: 1, max: 5 }),
    validate
  ],
  reviewController.getReviews
);

router.patch('/:id',
  authenticate,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('foodRating').optional().isInt({ min: 1, max: 5 }),
    body('deliveryRating').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
    body('isPublic').optional().isBoolean(),
    validate
  ],
  reviewController.updateReview
);

router.post('/:id/response',
  authenticate,
  authorize('admin'),
  [
    body('adminResponse').notEmpty().trim(),
    validate
  ],
  reviewController.addAdminResponse
);

router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router;
