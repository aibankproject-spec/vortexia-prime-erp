const mongoose = require('mongoose');
const { INVOICE_STATUS, CURRENCIES } = require('../config/constants');

const invoiceLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  description: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ['bank_transfer', 'cheque', 'cash', 'lc', 'online', 'advance'], required: true },
  reference: String,
  date: { type: Date, default: Date.now },
  notes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

    lines: [invoiceLineSchema],

    currency: { type: String, enum: CURRENCIES, default: 'QAR' },
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 5 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

    status: { type: String, enum: INVOICE_STATUS, default: 'draft' },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },

    payments: [paymentSchema],

    billingAddress: {
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },

    notes: String,
    signatureImage: String,
    companyDetails: {
      name: String,
      crNumber: String,
      vatNumber: String,
      address: String,
      phone: String,
      email: String,
      logo: String,
    },
  },
  { timestamps: true }
);

invoiceSchema.pre('save', function (next) {
  this.subtotal = this.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  this.taxAmount = this.subtotal * (this.taxRate / 100);
  this.totalAmount = this.subtotal + this.taxAmount;
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);
  this.balanceDue = this.totalAmount - this.paidAmount;

  if (this.balanceDue <= 0) this.status = 'paid';
  else if (this.paidAmount > 0) this.status = 'partially_paid';
  else if (this.dueDate < new Date() && this.status !== 'cancelled') this.status = 'overdue';
  next();
});

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ client: 1 });
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
