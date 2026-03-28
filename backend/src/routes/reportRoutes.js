const express = require('express');
const router = express.Router();
const r = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('super_admin', 'admin', 'sales_manager', 'finance'));

router.get('/dashboard', r.dashboardKPIs);
router.get('/revenue-trend', r.revenueTrend);
router.get('/client-revenue', r.clientRevenueSummary);
router.get('/client-aging', r.clientAgingReport);
router.get('/product-sales', r.productSalesSummary);
router.get('/slow-moving', r.slowMovingProducts);
router.get('/sales-performance', r.salesRepPerformance);
router.get('/quotation-conversion', r.quotationConversion);

module.exports = router;
