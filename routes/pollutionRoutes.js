const express = require('express');
const router = express.Router();
const pollutionController = require('../controllers/pollutionController');
const { auth, adminAuth } = require('../middleware/auth');
const guestAuth = require('../middleware/guestAuth');
const { validatePollutionReading } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');

// Get all pollution readings (with optional filtering and pagination)
router.get('/', generalLimiter, guestAuth, pollutionController.getPollutionReadings);

// Get latest pollution reading by city (public endpoint)
router.get('/latest', generalLimiter, guestAuth, pollutionController.getLatestPollutionByCity);

// Get pollution reading by ID
router.get('/:id', auth, pollutionController.getPollutionReadingById);

// Create pollution reading (authenticated users)
router.post('/', auth, validatePollutionReading, pollutionController.createPollutionReading);

// Update pollution reading (admin or owner)
router.put('/:id', auth, validatePollutionReading, pollutionController.updatePollutionReading);

// Delete pollution reading (admin or owner)
router.delete('/:id', auth, adminAuth, pollutionController.deletePollutionReading);

module.exports = router;
