const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name: { type: String, required: true, trim: true },
    designation: String,
    department: String,
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    mobile: String,
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    notes: String,
  },
  { timestamps: true }
);

contactSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('Contact', contactSchema);
