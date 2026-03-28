const express = require('express');
const router = express.Router();
const i = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/warehouses')
  .get(i.getWarehouses)
  .post(authorize('super_admin', 'admin'), i.createWarehouse);

router.put('/warehouses/:id', authorize('super_admin', 'admin'), i.updateWarehouse);

router.get('/', i.getInventory);
router.post('/stock', authorize('super_admin', 'admin', 'warehouse'), i.updateStock);
router.post('/transfer', authorize('super_admin', 'admin', 'warehouse'), i.transferStock);
router.get('/movements', i.getStockMovements);

module.exports = router;
