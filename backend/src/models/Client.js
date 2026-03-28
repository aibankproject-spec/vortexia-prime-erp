const mongoose = require('mongoose');
const { CLIENT_STATUS, CLIENT_SEGMENTS, TERRITORIES, PAYMENT_TERMS, CURRENCIES } = require('../config/constants');

const addressSchema = new mongoose.Schema({
  type: { type: String, enum: ['billing', 'shipping', 'both'], default: 'both' },
  label: String,
  street: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  isDefault: { type: Boolean, default: false },
});

const clientSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, index: true },
    crNumber: { type: String, trim: true },
    vatNumber: { type: String, trim: true },
    industryType: { type: String },
    segment: { type: String, enum: CLIENT_SEGMENTS },
    territory: { type: String, enum: TERRITORIES },
    addresses: [addressSchema],
    website: String,
    logo: String,

    // Financial
    creditLimit: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    paymentTerms: { type: String, enum: PAYMENT_TERMS, default: 'Net 30' },
    preferredCurrency: { type: String, enum: CURRENCIES, default: 'QAR' },
    pricingTier: { type: String, enum: ['standard', 'silver', 'gold', 'platinum', 'custom'], default: 'standard' },

    // Status
    status: { type: String, enum: CLIENT_STATUS, default: 'prospect' },
    statusHistory: [{
      status: String,
      reason: String,
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now },
    }],

    // Relations
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    primarySalesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    secondarySalesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Documents
    documents: [{
      name: String,
      type: { type: String },
      url: String,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      uploadedAt: { type: Date, default: Date.now },
    }],

    // Notes
    notes: String,
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

clientSchema.virtual('contacts', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'client',
});

clientSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'client',
});

clientSchema.virtual('creditUtilization').get(function () {
  if (!this.creditLimit) return 0;
  return Math.round((this.currentBalance / this.creditLimit) * 100);
});

clientSchema.index({ companyName: 'text' });
clientSchema.index({ segment: 1, territory: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ primarySalesRep: 1 });

module.exports = mongoose.model('Client', clientSchema);
