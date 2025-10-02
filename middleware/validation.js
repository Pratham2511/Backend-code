const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateUserRegistration = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validatePollutionReading = [
  body('city').notEmpty().withMessage('City is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('aqi').isInt({ min: 0, max: 500 }).withMessage('AQI must be between 0 and 500'),
  body('pm25').isFloat({ min: 0 }).withMessage('PM2.5 must be a positive number'),
  body('pm10').isFloat({ min: 0 }).withMessage('PM10 must be a positive number'),
  body('no2').isFloat({ min: 0 }).withMessage('NO2 must be a positive number'),
  body('o3').isFloat({ min: 0 }).withMessage('O3 must be a positive number'),
  body('so2').isFloat({ min: 0 }).withMessage('SO2 must be a positive number'),
  body('co').isFloat({ min: 0 }).withMessage('CO must be a positive number'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validatePollutionReading
};
