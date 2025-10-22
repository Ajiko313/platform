const express = require('express');
const { body, query } = require('express-validator');
const promoCodeController = require('../controllers/promoCodeController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('code').notEmpty().trim(),
    body('description').optional().trim(),
    body('discountType').isIn(['percentage', 'fixed_amount', 'free_delivery']),
    body('discountValue').isFloat({ min: 0 }),
    body('minOrderAmount').optional().isFloat({ min: 0 }),
    body('maxDiscountAmount').optional().isFloat({ min: 0 }),
    body('maxUsageCount').optional().isInt({ min: 1 }),
    body('maxUsagePerCustomer').optional().isInt({ min: 1 }),
    body('validFrom').isISO8601(),
    body('validUntil').isISO8601(),
    validate
  ],
  promoCodeController.createPromoCode
);

router.post('/validate',
  authenticate,
  [
    body('code').notEmpty().trim(),
    body('orderAmount').isFloat({ min: 0 }),
    body('restaurantId').optional().isInt(),
    validate
  ],
  promoCodeController.validatePromoCode
);

router.get('/', authenticate, authorize('admin'), promoCodeController.getPromoCodes);

router.get('/active', authenticate, promoCodeController.getActivePromoCodes);

router.get('/:id/usage', authenticate, authorize('admin'), promoCodeController.getPromoCodeUsage);

router.patch('/:id',
  authenticate,
  authorize('admin'),
  promoCodeController.updatePromoCode
);

router.delete('/:id', authenticate, authorize('admin'), promoCodeController.deletePromoCode);

module.exports = router;
