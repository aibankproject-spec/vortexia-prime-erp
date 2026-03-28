const express = require('express');
const router = express.Router();
const p = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (for catalogue)
router.get('/catalogue', p.getProducts);
router.get('/catalogue/:id', p.getProduct);
router.get('/categories/tree', p.getCategoryTree);

router.use(protect);

// Categories (MUST be before /:id to avoid conflict)
router.route('/categories')
  .get(p.getCategories)
  .post(authorize('super_admin', 'admin'), p.createCategory);

router.route('/categories/:catId')
  .put(authorize('super_admin', 'admin'), p.updateCategory)
  .delete(authorize('super_admin', 'admin'), p.deleteCategory);

// Brands (MUST be before /:id to avoid conflict)
router.route('/brands')
  .get(p.getBrands)
  .post(authorize('super_admin', 'admin'), p.createBrand);

router.route('/brands/:brandId')
  .put(authorize('super_admin', 'admin'), p.updateBrand)
  .delete(authorize('super_admin', 'admin'), p.deleteBrand);

// Bulk import (before /:id)
router.post('/bulk-import', authorize('super_admin', 'admin'), upload.single('file'), p.bulkImport);

// Products
router.route('/')
  .get(p.getProducts)
  .post(authorize('super_admin', 'admin'), p.createProduct);

router.route('/:id')
  .get(p.getProduct)
  .put(authorize('super_admin', 'admin'), p.updateProduct)
  .delete(authorize('super_admin', 'admin'), p.deleteProduct);

module.exports = router;
