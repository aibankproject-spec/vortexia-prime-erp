const mongoose = require('mongoose');
const { ORDER_STATUS, CURRENCIES, PAYMENT_STATUS } = require('../config/constants');

const orderLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: String,
  name: String,
  description: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
  notes: String,
  deliveredQty: { type: Number, default: 0 },
  backorderQty: { type: Number, default: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Linked docs
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    purchaseOrderNumber: String,
    purchaseOrderDate: Date,

    // Lines
    lines: [orderLineSchema],

    // Amounts
    currency: { type: String, enum: CURRENCIES, default: 'QAR' },
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 5 },
    taxAmount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    // Status
    status: { type: String, enum: ORDER_STATUS, default: 'rfq_received' },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS).flat(), default: 'pending' },

    // Dates
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,

    // Delivery
    deliveryAddress: {
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },
    deliveryMethod: String,
    trackingNumber: String,

    // Notes
    internalNotes: String,
    clientNotes: String,
    termsAndConditions: String,

    // Audit
    statusHistory: [{
      status: String,
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now },
      reason: String,
    }],

    // Amendments
    amendments: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now },
      reason: String,
    }],

    isRecurring: { type: Boolean, default: false },
    recurringTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'order',
});

orderSchema.pre('save', function (next) {
  // Calculate totals
  this.subtotal = this.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  this.taxAmount = (this.subtotal - this.totalDiscount) * (this.taxRate / 100);
  this.totalAmount = this.subtotal - this.totalDiscount + this.taxAmount + this.shippingCost;
  next();
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ client: 1, orderDate: -1 });
orderSchema.index({ salesRep: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
