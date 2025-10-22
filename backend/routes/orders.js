const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.post('/',
  authenticate,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.menuItemId').isInt(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('deliveryAddress').notEmpty().trim(),
    body('customerPhone').notEmpty().trim(),
    validate
  ],
  orderController.createOrder
);

router.get('/', authenticate, orderController.getOrders);

router.get('/:id', authenticate, orderController.getOrder);

router.patch('/:id/status',
  authenticate,
  authorize('admin'),
  [
    body('status').isIn(['pending', 'paid', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
    validate
  ],
  orderController.updateOrderStatus
);

router.post('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;
