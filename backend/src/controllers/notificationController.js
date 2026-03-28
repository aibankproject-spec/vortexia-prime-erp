const Notification = require('../models/Notification');
const { asyncHandler, sendResponse } = require('../utils/helpers');

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort('-createdAt')
    .limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  sendResponse(res, 200, { notifications, unreadCount });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
  sendResponse(res, 200, null, 'Notification marked as read');
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  sendResponse(res, 200, null, 'All notifications marked as read');
});
