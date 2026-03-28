const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true },
    description: { type: String },
    permissions: {
      customers: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      products: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      orders: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      quotations: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      invoices: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      inventory: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      sales: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      reports: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      users: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      settings: { type: [String], default: [], enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
