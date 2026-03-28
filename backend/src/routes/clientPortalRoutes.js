const express = require('express');
const router = express.Router();
const cp = require('../controllers/clientPortalController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('client'));

router.get('/dashboard', cp.getMyDashboard);
router.get('/profile', cp.getMyProfile);
router.get('/orders', cp.getMyOrders);
router.get('/orders/:id', cp.getMyOrder);
router.get('/quotations', cp.getMyQuotations);
router.get('/invoices', cp.getMyInvoices);
router.get('/invoices/:id', cp.getMyInvoice);
router.get('/catalogue', cp.browseCatalogue);
router.post('/rfq', cp.submitRFQ);

module.exports = router;
