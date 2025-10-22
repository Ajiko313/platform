const express = require('express');
const { body } = require('express-validator');
const deliveryController = require('../controllers/deliveryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get('/available',
  authenticate,
  authorize('delivery'),
  deliveryController.getAvailableDeliveries
);

router.get('/my',
  authenticate,
  authorize('delivery'),
  deliveryController.getMyDeliveries
);

router.get('/:id', authenticate, deliveryController.getDeliveryById);

router.post('/:id/accept',
  authenticate,
  authorize('delivery'),
  deliveryController.acceptDelivery
);

router.patch('/:id/status',
  authenticate,
  authorize('delivery'),
  [
    body('status').isIn(['assigned', 'picked_up', 'in_transit', 'delivered', 'failed']),
    validate
  ],
  deliveryController.updateDeliveryStatus
);

module.exports = router;
