const mongoose = require('mongoose');
const { STOCK_MOVEMENT_TYPES } = require('../config/constants');

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    totalStock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0 },
    maxStockLevel: { type: Number },
    reorderPoint: { type: Number, default: 0 },
    reorderQuantity: { type: Number },
    location: { type: String },
    batchNumber: String,
    lastStockCheck: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

inventorySchema.virtual('availableStock').get(function () {
  return this.totalStock - this.reservedStock;
});

inventorySchema.virtual('isLowStock').get(function () {
  return this.totalStock <= this.reorderPoint;
});

inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });

const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    type: { type: String, enum: STOCK_MOVEMENT_TYPES, required: true },
    quantity: { type: Number, required: true },
    referenceNumber: String,
    referenceType: { type: String, enum: ['order', 'transfer', 'adjustment', 'return', 'manual'] },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    notes: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ warehouse: 1 });

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    address: {
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Inventory = mongoose.model('Inventory', inventorySchema);
const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = { Inventory, StockMovement, Warehouse };
