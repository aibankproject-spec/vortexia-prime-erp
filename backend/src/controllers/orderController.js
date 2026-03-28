const Order = require('../models/Order');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const { Inventory } = require('../models/Inventory');
const DocumentSequence = require('../models/DocumentSequence');
const Notification = require('../models/Notification');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler, sendResponse, sendPaginatedResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

exports.getOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.client) filter.client = req.query.client;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.salesRep) filter.salesRep = req.query.salesRep;
  if (req.user.role === 'sales_rep') filter.salesRep = req.user._id;
  if (req.user.role === 'client') {
    const client = await Client.findOne({ user: req.user._id });
    if (client) filter.client = client._id;
  }

  const total = await Order.countDocuments(filter);
  const features = new APIFeatures(Order.find(filter), req.query)
    .search(['orderNumber', 'purchaseOrderNumber'])
    .sort()
    .paginate();

  const orders = await features.query
    .populate('client', 'companyName')
    .populate('salesRep', 'firstName lastName');
  sendPaginatedResponse(res, 200, orders, total, features.pagination);
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('client', 'companyName addresses paymentTerms')
    .populate('salesRep', 'firstName lastName email')
    .populate('quotation')
    .populate('lines.product', 'name sku images');

  if (!order) throw new AppError('Order not found', 404);
  sendResponse(res, 200, order);
});

exports.createOrder = asyncHandler(async (req, res) => {
  const orderNumber = await DocumentSequence.getNextNumber('order', 'ORD');
  const order = await Order.create({ ...req.body, orderNumber });

  // Reserve stock
  for (const line of order.lines) {
    await Inventory.findOneAndUpdate(
      { product: line.product },
      { $inc: { reservedStock: line.quantity } }
    );
  }

  // Notify
  if (order.client) {
    const client = await Client.findById(order.client);
    if (client?.user) {
      await Notification.create({
        user: client.user,
        title: 'New Order Created',
        message: `Order ${order.orderNumber} has been created`,
        type: 'order',
        entityType: 'Order',
        entityId: order._id,
      });
    }
  }

  sendResponse(res, 201, order, 'Order created');
});

exports.updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  // Track amendments
  const changedFields = Object.keys(req.body).filter(key => {
    return JSON.stringify(order[key]) !== JSON.stringify(req.body[key]);
  });

  for (const field of changedFields) {
    order.amendments.push({
      field,
      oldValue: order[field],
      newValue: req.body[field],
      changedBy: req.user._id,
      reason: req.body.amendmentReason || 'Updated',
    });
  }

  Object.assign(order, req.body);
  await order.save();
  sendResponse(res, 200, order, 'Order updated');
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  order.statusHistory.push({ status, changedBy: req.user._id, reason });
  order.status = status;

  // Release stock on cancellation
  if (status === 'cancelled') {
    for (const line of order.lines) {
      await Inventory.findOneAndUpdate(
        { product: line.product },
        { $inc: { reservedStock: -line.quantity } }
      );
    }
  }

  // Auto-generate invoice on delivery
  if (status === 'delivered') {
    order.actualDeliveryDate = new Date();
  }

  await order.save();

  // Notify client
  const client = await Client.findById(order.client);
  if (client?.user) {
    await Notification.create({
      user: client.user,
      title: 'Order Status Updated',
      message: `Order ${order.orderNumber} status changed to: ${status.replace(/_/g, ' ')}`,
      type: 'order',
      entityType: 'Order',
      entityId: order._id,
    });
  }

  sendResponse(res, 200, order, 'Order status updated');
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (!['rfq_received', 'quotation_prepared'].includes(order.status)) {
    throw new AppError('Can only delete orders in draft/rfq stage', 400);
  }

  for (const line of order.lines) {
    await Inventory.findOneAndUpdate(
      { product: line.product },
      { $inc: { reservedStock: -line.quantity } }
    );
  }

  await Order.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'Order deleted');
});

// Quotations
exports.getQuotations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.client) filter.client = req.query.client;
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === 'sales_rep') filter.salesRep = req.user._id;

  const total = await Quotation.countDocuments(filter);
  const features = new APIFeatures(Quotation.find(filter), req.query).sort().paginate();
  const quotations = await features.query
    .populate('client', 'companyName')
    .populate('salesRep', 'firstName lastName');
  sendPaginatedResponse(res, 200, quotations, total, features.pagination);
});

exports.getQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('client', 'companyName addresses')
    .populate('salesRep', 'firstName lastName email')
    .populate('lines.product', 'name sku images');
  if (!quotation) throw new AppError('Quotation not found', 404);
  sendResponse(res, 200, quotation);
});

exports.createQuotation = asyncHandler(async (req, res) => {
  const quotationNumber = await DocumentSequence.getNextNumber('quotation', 'QTN');
  const quotation = await Quotation.create({
    ...req.body,
    quotationNumber,
    salesRep: req.user._id,
  });
  sendResponse(res, 201, quotation, 'Quotation created');
});

exports.updateQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!quotation) throw new AppError('Quotation not found', 404);
  sendResponse(res, 200, quotation, 'Quotation updated');
});

exports.approveQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new AppError('Quotation not found', 404);

  quotation.approvedBy = req.user._id;
  quotation.approvedAt = new Date();
  quotation.status = 'sent';
  await quotation.save();
  sendResponse(res, 200, quotation, 'Quotation approved');
});

exports.convertQuotationToOrder = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new AppError('Quotation not found', 404);
  if (quotation.convertedToOrder) throw new AppError('Quotation already converted', 400);

  const orderNumber = await DocumentSequence.getNextNumber('order', 'ORD');
  const order = await Order.create({
    orderNumber,
    client: quotation.client,
    salesRep: quotation.salesRep,
    quotation: quotation._id,
    lines: quotation.lines,
    currency: quotation.currency,
    subtotal: quotation.subtotal,
    totalDiscount: quotation.totalDiscount,
    taxRate: quotation.taxRate,
    taxAmount: quotation.taxAmount,
    totalAmount: quotation.totalAmount,
    status: 'po_received',
  });

  quotation.convertedToOrder = order._id;
  quotation.convertedAt = new Date();
  quotation.status = 'converted';
  await quotation.save();

  sendResponse(res, 201, order, 'Quotation converted to order');
});

// Invoices
exports.getInvoices = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.client) filter.client = req.query.client;
  if (req.query.status) filter.status = req.query.status;

  const total = await Invoice.countDocuments(filter);
  const features = new APIFeatures(Invoice.find(filter), req.query).sort().paginate();
  const invoices = await features.query.populate('client', 'companyName').populate('order', 'orderNumber');
  sendPaginatedResponse(res, 200, invoices, total, features.pagination);
});

exports.getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('client', 'companyName addresses vatNumber')
    .populate('order', 'orderNumber');
  if (!invoice) throw new AppError('Invoice not found', 404);
  sendResponse(res, 200, invoice);
});

exports.createInvoice = asyncHandler(async (req, res) => {
  const invoiceNumber = await DocumentSequence.getNextNumber('invoice', 'INV');
  const invoice = await Invoice.create({ ...req.body, invoiceNumber });
  sendResponse(res, 201, invoice, 'Invoice created');
});

exports.recordPayment = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new AppError('Invoice not found', 404);

  invoice.payments.push({ ...req.body, recordedBy: req.user._id });
  await invoice.save();

  // Update client balance
  await Client.findByIdAndUpdate(invoice.client, {
    $inc: { currentBalance: -req.body.amount },
  });

  sendResponse(res, 200, invoice, 'Payment recorded');
});
