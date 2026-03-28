const express = require('express');
const router = express.Router();
const o = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Orders
router.route('/orders')
  .get(o.getOrders)
  .post(authorize('super_admin', 'admin', 'sales_manager', 'sales_rep', 'client'), o.createOrder);

router.route('/orders/:id')
  .get(o.getOrder)
  .put(authorize('super_admin', 'admin', 'sales_manager', 'sales_rep'), o.updateOrder)
  .delete(authorize('super_admin', 'admin'), o.deleteOrder);

router.put('/orders/:id/status', authorize('super_admin', 'admin', 'sales_manager', 'warehouse'), o.updateOrderStatus);

// Quotations
router.route('/quotations')
  .get(o.getQuotations)
  .post(authorize('super_admin', 'admin', 'sales_manager', 'sales_rep'), o.createQuotation);

router.route('/quotations/:id')
  .get(o.getQuotation)
  .put(authorize('super_admin', 'admin', 'sales_manager', 'sales_rep'), o.updateQuotation);

router.put('/quotations/:id/approve', authorize('super_admin', 'admin', 'sales_manager'), o.approveQuotation);
router.post('/quotations/:id/convert', authorize('super_admin', 'admin', 'sales_manager'), o.convertQuotationToOrder);

// Invoices
router.route('/invoices')
  .get(o.getInvoices)
  .post(authorize('super_admin', 'admin', 'finance'), o.createInvoice);

router.get('/invoices/:id', o.getInvoice);
router.post('/invoices/:id/payment', authorize('super_admin', 'admin', 'finance'), o.recordPayment);

module.exports = router;
