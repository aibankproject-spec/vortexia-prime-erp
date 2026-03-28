const express = require('express');
const router = express.Router();
const r = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Dashboard KPIs - accessible to all authenticated users
router.get('/dashboard', r.dashboardKPIs);
router.get('/revenue-trend', r.revenueTrend);

// Detailed reports - restricted to management/finance
const reportAuth = authorize('super_admin', 'admin', 'sales_manager', 'sales_rep', 'finance');
router.get('/client-revenue', reportAuth, r.clientRevenueSummary);
router.get('/client-aging', reportAuth, r.clientAgingReport);
router.get('/product-sales', reportAuth, r.productSalesSummary);
router.get('/slow-moving', reportAuth, r.slowMovingProducts);
router.get('/sales-performance', reportAuth, r.salesRepPerformance);
router.get('/quotation-conversion', reportAuth, r.quotationConversion);

module.exports = router;
