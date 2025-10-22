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

// GPS Tracking routes
router.post('/:id/location',
  authenticate,
  authorize('delivery'),
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    validate
  ],
  deliveryController.updateLocation
);

router.get('/:id/tracking',
  authenticate,
  deliveryController.getDeliveryTracking
);

router.post('/:id/eta',
  authenticate,
  authorize('delivery'),
  [
    body('estimatedMinutes').isInt({ min: 1 }),
    body('distance').optional().isFloat({ min: 0 }),
    validate
  ],
  deliveryController.updateEstimatedArrival
);

module.exports = router;
