const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler, sendResponse, sendPaginatedResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// Products
exports.getProducts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.brand) filter.brand = req.query.brand;
  if (req.query.status) filter.status = req.query.status;

  const total = await Product.countDocuments(filter);
  const features = new APIFeatures(Product.find(filter), req.query)
    .search(['name', 'sku', 'description', 'materialGrade'])
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query.populate('category', 'name slug').populate('brand', 'name logo');
  sendPaginatedResponse(res, 200, products, total, features.pagination);
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug parent')
    .populate('brand', 'name logo website')
    .populate('relatedProducts', 'name sku images prices')
    .populate('accessories', 'name sku images prices')
    .populate('spareParts', 'name sku images prices');

  if (!product) throw new AppError('Product not found', 404);
  sendResponse(res, 200, product);
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  await Category.findByIdAndUpdate(req.body.category, { $inc: { productCount: 1 } });
  if (req.body.brand) await Brand.findByIdAndUpdate(req.body.brand, { $inc: { productCount: 1 } });
  sendResponse(res, 201, product, 'Product created successfully');
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  // Track price changes
  if (req.body.prices) {
    for (const newPrice of req.body.prices) {
      const oldPrice = product.prices.find(p => p.currency === newPrice.currency);
      if (oldPrice && oldPrice.basePrice !== newPrice.basePrice) {
        product.priceHistory.push({
          currency: newPrice.currency,
          oldPrice: oldPrice.basePrice,
          newPrice: newPrice.basePrice,
          changedBy: req.user._id,
        });
      }
    }
  }

  Object.assign(product, req.body);
  await product.save();
  sendResponse(res, 200, product, 'Product updated');
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
  if (product.brand) await Brand.findByIdAndUpdate(product.brand, { $inc: { productCount: -1 } });
  sendResponse(res, 200, null, 'Product deleted');
});

exports.bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload a file', 400);
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const results = { created: 0, errors: [] };
  for (const row of data) {
    try {
      await Product.create({
        sku: row['SKU'],
        name: row['Name'],
        description: row['Description'],
        category: row['Category ID'],
        brand: row['Brand ID'],
        unitOfMeasure: row['UOM'] || 'PCS',
        materialGrade: row['Material Grade'],
        pressureRating: row['Pressure Rating'],
        prices: [{ currency: 'QAR', basePrice: row['Price (QAR)'] || 0 }],
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: row['SKU'], error: err.message });
    }
  }
  sendResponse(res, 200, results, `Imported ${results.created} products`);
});

// Categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ parent: req.query.parent || null })
    .sort('sortOrder name')
    .populate('children');
  sendResponse(res, 200, categories);
});

exports.getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('level sortOrder name');
  // Build tree
  const map = {};
  const tree = [];
  categories.forEach(cat => { map[cat._id] = { ...cat.toObject(), children: [] }; });
  categories.forEach(cat => {
    if (cat.parent) {
      map[cat.parent]?.children.push(map[cat._id]);
    } else {
      tree.push(map[cat._id]);
    }
  });
  sendResponse(res, 200, tree);
});

exports.createCategory = asyncHandler(async (req, res) => {
  if (req.body.parent) {
    const parent = await Category.findById(req.body.parent);
    if (parent) req.body.level = parent.level + 1;
  }
  const category = await Category.create(req.body);
  sendResponse(res, 201, category, 'Category created');
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.catId, req.body, { new: true });
  if (!category) throw new AppError('Category not found', 404);
  sendResponse(res, 200, category, 'Category updated');
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const hasProducts = await Product.countDocuments({ category: req.params.catId });
  if (hasProducts > 0) throw new AppError('Cannot delete category with products', 400);
  const hasChildren = await Category.countDocuments({ parent: req.params.catId });
  if (hasChildren > 0) throw new AppError('Cannot delete category with sub-categories', 400);
  await Category.findByIdAndDelete(req.params.catId);
  sendResponse(res, 200, null, 'Category deleted');
});

// Brands
exports.getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ isActive: true }).sort('name');
  sendResponse(res, 200, brands);
});

exports.createBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.create(req.body);
  sendResponse(res, 201, brand, 'Brand created');
});

exports.updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(req.params.brandId, req.body, { new: true });
  if (!brand) throw new AppError('Brand not found', 404);
  sendResponse(res, 200, brand, 'Brand updated');
});

exports.deleteBrand = asyncHandler(async (req, res) => {
  await Brand.findByIdAndDelete(req.params.brandId);
  sendResponse(res, 200, null, 'Brand deleted');
});
