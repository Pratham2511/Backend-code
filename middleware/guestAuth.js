const { auth } = require('./auth');

const guestAuth = async (req, res, next) => {
  try {
    // Check for guest header or token
    const userType = req.header('User-Type');
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // If no userType header is present, try token auth
    if (!userType && token) {
      return auth(req, res, next);
    }

    // Allow guest access for certain routes
    if (userType === 'guest') {
      req.user = { isGuest: true };
      next();
    } else {
      return res.status(401).json({ message: 'Access denied. Invalid user type.' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid authentication.' });
  }
};

module.exports = guestAuth;