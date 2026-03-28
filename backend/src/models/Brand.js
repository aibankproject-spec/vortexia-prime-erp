const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true },
    logo: String,
    website: String,
    description: String,
    contactInfo: {
      email: String,
      phone: String,
      address: String,
    },
    isAuthorizedDistributor: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

brandSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    const slugify = require('slugify');
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
