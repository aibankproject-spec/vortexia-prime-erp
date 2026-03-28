const mongoose = require('mongoose');
const { QUOTATION_STATUS, CURRENCIES } = require('../config/constants');

const quotationLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: String,
  name: String,
  description: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, unique: true, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },

    lines: [quotationLineSchema],

    currency: { type: String, enum: CURRENCIES, default: 'QAR' },
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 5 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    status: { type: String, enum: QUOTATION_STATUS, default: 'draft' },
    validityDate: { type: Date, required: true },
    deliveryTerms: String,
    paymentTerms: String,
    termsAndConditions: String,
    internalNotes: String,

    // Approval
    requiresApproval: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    maxDiscountWithoutApproval: { type: Number, default: 10 },

    // Conversion
    convertedToOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    convertedAt: Date,

    // Revision
    revision: { type: Number, default: 1 },
    parentQuotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },

    signatureImage: String,
  },
  { timestamps: true }
);

quotationSchema.pre('save', function (next) {
  this.subtotal = this.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  this.taxAmount = (this.subtotal - this.totalDiscount) * (this.taxRate / 100);
  this.totalAmount = this.subtotal - this.totalDiscount + this.taxAmount;

  // Check if approval needed
  const maxDiscount = this.lines.reduce((max, line) => Math.max(max, line.discount || 0), 0);
  this.requiresApproval = maxDiscount > this.maxDiscountWithoutApproval;
  next();
});

quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ client: 1 });
quotationSchema.index({ salesRep: 1 });
quotationSchema.index({ status: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
