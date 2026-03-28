const express = require('express');
const router = express.Router();
const u = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('super_admin', 'admin'));

router.route('/')
  .get(u.getUsers)
  .post(u.createUser);

router.route('/:id')
  .get(u.getUser)
  .put(u.updateUser)
  .delete(u.deleteUser);

router.put('/:id/unlock', u.unlockUser);
router.get('/audit-logs', u.getAuditLogs);

module.exports = router;
