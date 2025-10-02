const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Register
router.post('/register', authLimiter, validateUserRegistration, authController.register);

// Login
router.post('/login', authLimiter, validateUserLogin, authController.login);

// Get current user
router.get('/me', auth, authController.getMe);

module.exports = router;
