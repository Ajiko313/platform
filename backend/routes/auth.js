const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty().trim(),
    validate
  ],
  authController.register
);

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
  ],
  authController.login
);

router.post('/telegram',
  [
    body('telegramId').notEmpty(),
    body('firstName').notEmpty().trim(),
    validate
  ],
  authController.telegramAuth
);

router.get('/profile', authenticate, authController.getProfile);

router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
