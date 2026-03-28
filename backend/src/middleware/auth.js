const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'User not found or account inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

const checkPermission = (module, action) => {
  return (req, res, next) => {
    // Super admin has all permissions
    if (req.user.role === 'super_admin') return next();

    const userPermissions = req.user.permissions?.get(module) || [];
    if (!userPermissions.includes(action) && !userPermissions.includes('*')) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${action} in ${module}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize, checkPermission };
