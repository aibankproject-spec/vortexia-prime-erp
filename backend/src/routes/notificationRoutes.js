const express = require('express');
const router = express.Router();
const n = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', n.getNotifications);
router.put('/:id/read', n.markAsRead);
router.put('/read-all', n.markAllAsRead);

module.exports = router;
