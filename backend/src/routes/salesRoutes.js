const express = require('express');
const router = express.Router();
const s = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Opportunities
router.route('/opportunities')
  .get(s.getOpportunities)
  .post(authorize('super_admin', 'admin', 'sales_manager', 'sales_rep'), s.createOpportunity);

router.get('/pipeline', s.getPipeline);

router.route('/opportunities/:id')
  .get(s.getOpportunity)
  .put(authorize('super_admin', 'admin', 'sales_manager', 'sales_rep'), s.updateOpportunity)
  .delete(authorize('super_admin', 'admin', 'sales_manager'), s.deleteOpportunity);

// Activities
router.route('/activities')
  .get(s.getActivities)
  .post(s.createActivity);

router.put('/activities/:id', s.updateActivity);

// Targets
router.route('/targets')
  .get(s.getSalesTargets)
  .post(authorize('super_admin', 'admin', 'sales_manager'), s.setSalesTarget);

// Follow-ups
router.get('/follow-ups', s.getFollowUps);

module.exports = router;
