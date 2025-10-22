const express = require('express');
const { body } = require('express-validator');
const loyaltyController = require('../controllers/loyaltyController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get('/', authenticate, loyaltyController.getLoyaltyProgram);

router.get('/transactions', authenticate, loyaltyController.getLoyaltyTransactions);

router.post('/redeem',
  authenticate,
  [
    body('points').isInt({ min: 100 }),
    body('orderId').optional().isInt(),
    validate
  ],
  loyaltyController.redeemPoints
);

router.post('/bonus',
  authenticate,
  authorize('admin'),
  [
    body('customerId').isInt(),
    body('points').isInt({ min: 1 }),
    body('description').optional().trim(),
    validate
  ],
  loyaltyController.addBonusPoints
);

module.exports = router;
