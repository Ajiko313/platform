const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.post('/',
  authenticate,
  [
    body('orderId').isInt(),
    body('method').isIn(['card', 'telegram_stars', 'cash']),
    validate
  ],
  paymentController.createPayment
);

router.post('/webhook', paymentController.handleWebhook);

router.get('/status/:externalId', authenticate, paymentController.getPaymentStatus);

router.post('/:id/refund',
  authenticate,
  authorize('admin'),
  paymentController.refundPayment
);

module.exports = router;
