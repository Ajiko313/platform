const express = require('express');
const { query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get('/dashboard',
  authenticate,
  authorize('admin'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('restaurantId').optional().isInt(),
    validate
  ],
  analyticsController.getDashboardStats
);

router.get('/customer/:customerId',
  authenticate,
  authorize('admin'),
  analyticsController.getCustomerAnalytics
);

router.get('/driver/:driverId',
  authenticate,
  authorize('admin'),
  analyticsController.getDriverAnalytics
);

router.get('/revenue',
  authenticate,
  authorize('admin'),
  [
    query('period').optional().isIn(['day', 'week', 'month', 'year']),
    query('restaurantId').optional().isInt(),
    validate
  ],
  analyticsController.getRevenueReport
);

module.exports = router;
