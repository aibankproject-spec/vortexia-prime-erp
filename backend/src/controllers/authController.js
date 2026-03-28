const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');
const { asyncHandler, sendResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

exports.register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already registered', 400);

  const status = role === 'client' ? 'pending_approval' : 'active';
  const user = await User.create({ email, password, firstName, lastName, phone, role: role || 'client', status });

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  sendResponse(res, 201, {
    user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, status: user.status },
    accessToken,
    refreshToken,
  }, 'Registration successful');
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new AppError('Please provide email and password', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid credentials', 401);

  if (user.isLocked()) throw new AppError('Account is locked. Please contact administrator.', 423);
  if (user.status === 'inactive') throw new AppError('Account has been deactivated', 403);
  if (user.status === 'locked') throw new AppError('Account is locked', 423);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.status = 'locked';
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    await user.save({ validateBeforeSave: false });
    throw new AppError('Invalid credentials', 401);
  }

  // Reset login attempts on success
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  await AuditLog.create({
    user: user._id, action: 'login', module: 'auth',
    description: 'User logged in', ipAddress: req.ip, userAgent: req.get('User-Agent'),
  });

  sendResponse(res, 200, {
    user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatar: user.avatar },
    accessToken,
    refreshToken,
  }, 'Login successful');
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400);

  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  sendResponse(res, 200, { accessToken: newAccessToken, refreshToken: newRefreshToken });
});

exports.logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  sendResponse(res, 200, null, 'Logged out successfully');
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendResponse(res, 200, user);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName, phone, avatar },
    { new: true, runValidators: true }
  );
  sendResponse(res, 200, user, 'Profile updated');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();
  const accessToken = user.generateAccessToken();
  sendResponse(res, 200, { accessToken }, 'Password changed successfully');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new AppError('No user found with that email', 404);

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  // In production, send email with reset link
  sendResponse(res, 200, { resetToken }, 'Password reset token generated');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendResponse(res, 200, null, 'Password reset successful');
});
