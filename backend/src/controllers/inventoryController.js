const { Inventory, StockMovement, Warehouse } = require('../models/Inventory');
const Notification = require('../models/Notification');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler, sendResponse, sendPaginatedResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// Warehouses
exports.getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find().populate('manager', 'firstName lastName');
  sendResponse(res, 200, warehouses);
});

exports.createWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.create(req.body);
  sendResponse(res, 201, warehouse, 'Warehouse created');
});

exports.updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!warehouse) throw new AppError('Warehouse not found', 404);
  sendResponse(res, 200, warehouse, 'Warehouse updated');
});

// Inventory
exports.getInventory = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  if (req.query.product) filter.product = req.query.product;
  if (req.query.lowStock === 'true') filter.$expr = { $lte: ['$totalStock', '$reorderPoint'] };

  const total = await Inventory.countDocuments(filter);
  const features = new APIFeatures(Inventory.find(filter), req.query).sort().paginate();
  const inventory = await features.query
    .populate('product', 'name sku images')
    .populate('warehouse', 'name code');
  sendPaginatedResponse(res, 200, inventory, total, features.pagination);
});

exports.updateStock = asyncHandler(async (req, res) => {
  const { product, warehouse, quantity, type, notes, referenceNumber } = req.body;

  let inventory = await Inventory.findOne({ product, warehouse });
  if (!inventory) {
    inventory = await Inventory.create({ product, warehouse, totalStock: 0 });
  }

  if (type === 'receipt') {
    inventory.totalStock += quantity;
  } else if (type === 'issue') {
    if (inventory.totalStock < quantity) throw new AppError('Insufficient stock', 400);
    inventory.totalStock -= quantity;
  } else if (type === 'adjustment') {
    inventory.totalStock = quantity;
  }

  await inventory.save();

  // Record movement
  await StockMovement.create({
    product, warehouse, type, quantity, referenceNumber, notes,
    performedBy: req.user._id,
  });

  // Check low stock alert
  if (inventory.totalStock <= inventory.reorderPoint) {
    await Notification.create({
      user: req.user._id,
      title: 'Low Stock Alert',
      message: `Stock for product is at ${inventory.totalStock} units (reorder point: ${inventory.reorderPoint})`,
      type: 'stock',
      entityType: 'Inventory',
      entityId: inventory._id,
    });
  }

  sendResponse(res, 200, inventory, 'Stock updated');
});

exports.getStockMovements = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.product) filter.product = req.query.product;
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  if (req.query.type) filter.type = req.query.type;

  const total = await StockMovement.countDocuments(filter);
  const features = new APIFeatures(StockMovement.find(filter), req.query).sort().paginate();
  const movements = await features.query
    .populate('product', 'name sku')
    .populate('warehouse', 'name code')
    .populate('performedBy', 'firstName lastName');
  sendPaginatedResponse(res, 200, movements, total, features.pagination);
});

exports.transferStock = asyncHandler(async (req, res) => {
  const { product, fromWarehouse, toWarehouse, quantity, notes } = req.body;

  const sourceInv = await Inventory.findOne({ product, warehouse: fromWarehouse });
  if (!sourceInv || sourceInv.availableStock < quantity) {
    throw new AppError('Insufficient stock at source warehouse', 400);
  }

  sourceInv.totalStock -= quantity;
  await sourceInv.save();

  let destInv = await Inventory.findOne({ product, warehouse: toWarehouse });
  if (!destInv) destInv = await Inventory.create({ product, warehouse: toWarehouse, totalStock: 0 });
  destInv.totalStock += quantity;
  await destInv.save();

  // Record movements
  await StockMovement.create({
    product, warehouse: fromWarehouse, type: 'transfer', quantity: -quantity,
    fromWarehouse, toWarehouse, notes, performedBy: req.user._id,
  });
  await StockMovement.create({
    product, warehouse: toWarehouse, type: 'transfer', quantity,
    fromWarehouse, toWarehouse, notes, performedBy: req.user._id,
  });

  sendResponse(res, 200, { source: sourceInv, destination: destInv }, 'Stock transferred');
});
