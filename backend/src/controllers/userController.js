const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler, sendResponse, sendPaginatedResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

exports.getUsers = asyncHandler(async (req, res) => {
  const total = await User.countDocuments();
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .search(['firstName', 'lastName', 'email'])
    .sort()
    .paginate();
  const users = await features.query;
  sendPaginatedResponse(res, 200, users, total, features.pagination);
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  sendResponse(res, 200, user);
});

exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  sendResponse(res, 201, user, 'User created');
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { password, ...updateData } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  sendResponse(res, 200, user, 'User updated');
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { status: 'inactive' });
  sendResponse(res, 200, null, 'User deactivated');
});

exports.unlockUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { status: 'active', loginAttempts: 0, lockUntil: null });
  sendResponse(res, 200, null, 'User unlocked');
});

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.user) filter.user = req.query.user;
  if (req.query.module) filter.module = req.query.module;

  const total = await AuditLog.countDocuments(filter);
  const features = new APIFeatures(AuditLog.find(filter), req.query).sort().paginate();
  const logs = await features.query.populate('user', 'firstName lastName email');
  sendPaginatedResponse(res, 200, logs, total, features.pagination);
});
