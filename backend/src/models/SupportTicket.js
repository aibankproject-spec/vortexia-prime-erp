const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  attachments: [{ name: String, url: String }],
  createdAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, required: true },
    category: { type: String, enum: ['product_query', 'order_issue', 'complaint', 'return', 'general', 'technical'], required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'waiting_client', 'resolved', 'closed'], default: 'open' },
    messages: [ticketMessageSchema],
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    resolvedAt: Date,
    closedAt: Date,
    slaDeadline: Date,
  },
  { timestamps: true }
);

supportTicketSchema.index({ client: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1 });
supportTicketSchema.index({ ticketNumber: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
