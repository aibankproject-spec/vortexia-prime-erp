const mongoose = require('mongoose');
const { PRODUCT_STATUS, COMPLIANCE_STANDARDS, CURRENCIES } = require('../config/constants');

const priceSchema = new mongoose.Schema({
  currency: { type: String, enum: CURRENCIES, required: true },
  basePrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, min: 0 },
  effectiveDate: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const volumePricingSchema = new mongoose.Schema({
  minQty: { type: Number, required: true },
  maxQty: Number,
  pricePerUnit: { type: Number, required: true },
  currency: { type: String, enum: CURRENCIES, default: 'QAR' },
});

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String },
    shortDescription: String,

    // Hierarchy
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },

    // Specs
    unitOfMeasure: { type: String, default: 'PCS' },
    weight: { type: Number },
    weightUnit: { type: String, default: 'kg' },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'mm' },
    },

    // Industry attributes (dynamic per category)
    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    complianceStandards: [{ type: String, enum: COMPLIANCE_STANDARDS }],
    materialGrade: String,
    pressureRating: String,
    temperatureRange: String,
    sizeSpecification: String,

    // Media
    images: [{
      url: String,
      alt: String,
      isPrimary: { type: Boolean, default: false },
      sortOrder: { type: Number, default: 0 },
    }],
    datasheets: [{
      name: String,
      type: { type: String, enum: ['technical', 'safety', 'msds', 'other'] },
      url: String,
      uploadedAt: { type: Date, default: Date.now },
    }],

    // Pricing
    prices: [priceSchema],
    volumePricing: [volumePricingSchema],
    priceHistory: [{
      currency: String,
      oldPrice: Number,
      newPrice: Number,
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now },
    }],

    // Client-specific pricing tiers
    tierPricing: [{
      tier: { type: String, enum: ['silver', 'gold', 'platinum'] },
      currency: { type: String, enum: CURRENCIES },
      price: Number,
    }],

    // Promotional pricing
    promotionalPrice: {
      price: Number,
      currency: { type: String, enum: CURRENCIES },
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: false },
    },

    // Relations
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    accessories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    spareParts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Status
    status: { type: String, enum: PRODUCT_STATUS, default: 'active' },
    isFeatured: { type: Boolean, default: false },

    // SEO
    metaTitle: String,
    metaDescription: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('inventory', {
  ref: 'Inventory',
  localField: '_id',
  foreignField: 'product',
});

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    const slugify = require('slugify');
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

productSchema.methods.getPrice = function (currency = 'QAR', tier = 'standard') {
  // Check promotional price first
  if (this.promotionalPrice?.isActive) {
    const now = new Date();
    if (this.promotionalPrice.startDate <= now && this.promotionalPrice.endDate >= now) {
      return this.promotionalPrice.price;
    }
  }
  // Check tier pricing
  if (tier !== 'standard') {
    const tierPrice = this.tierPricing.find(t => t.tier === tier && t.currency === currency);
    if (tierPrice) return tierPrice.price;
  }
  // Base price
  const price = this.prices.find(p => p.currency === currency);
  return price ? price.basePrice : 0;
};

productSchema.index({ name: 'text', sku: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ status: 1, isFeatured: 1 });

module.exports = mongoose.model('Product', productSchema);
