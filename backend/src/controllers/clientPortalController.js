const Client = require('../models/Client');
const Order = require('../models/Order');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Contact = require('../models/Contact');
const SupportTicket = require('../models/SupportTicket');
const DocumentSequence = require('../models/DocumentSequence');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler, sendResponse, sendPaginatedResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// Helper to get the client record linked to logged-in user
const getClientForUser = async (userId) => {
  const client = await Client.findOne({ user: userId });
  if (!client) throw new AppError('No client profile linked to this account', 404);
  return client;
};

// Client Dashboard
exports.getMyDashboard = asyncHandler(async (req, res) => {
  const client = await getClientForUser(req.user._id);

  const [
    totalOrders,
    activeOrders,
    totalSpent,
    pendingInvoices,
    recentOrders,
    recentInvoices,
  ] = await Promise.all([
    Order.countDocuments({ client: client._id, status: { $nin: ['cancelled'] } }),
    Order.countDocuments({ client: client._id, status: { $nin: ['closed', 'cancelled', 'payment_received'] } }),
    Order.aggregate([
      { $match: { client: client._id, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Invoice.aggregate([
      { $match: { client: client._id, status: { $in: ['sent', 'partially_paid', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$balanceDue' } } },
    ]),
    Order.find({ client: client._id }).sort('-orderDate').limit(5)
      .select('orderNumber status totalAmount orderDate currency'),
    Invoice.find({ client: client._id }).sort('-issueDate').limit(5)
      .select('invoiceNumber status totalAmount balanceDue dueDate'),
  ]);

  sendResponse(res, 200, {
    client: {
      companyName: client.companyName,
      status: client.status,
      creditLimit: client.creditLimit,
      currentBalance: client.currentBalance,
      paymentTerms: client.paymentTerms,
      pricingTier: client.pricingTier,
    },
    stats: {
      totalOrders,
      activeOrders,
      totalSpent: totalSpent[0]?.total || 0,
      outstandingBalance: pendingInvoices[0]?.total || 0,
    },
    recentOrders,
    recentInvoices,
  });
});

// My Orders
exports.getMyOrders = asyncHandler(async (req, res) => {
  const client = await getClientForUser(req.user._id);
  const filter = { client: client._id };
  if (req.query.status) filter.status = req.query.status;

  const total = await Order.countDocuments(filter);
  const features = new APIFeatures(Order.find(filter), req.query)
    .search(['orderNumber', 'purchaseOrderNumber'])
    .sort()
    .paginate();
  const orders = await features.query.select('orderNumber status totalAmount orderDate currency paymentStatus lines expectedDeliveryDate');
  sendPaginatedResponse(res, 200, orders, total, features.pagination);
});

// My Order Detail
exports.getMyOrder = asyncHandler(async (req, res) => {
  const client = await getClientForUser(req.user._id);
  const order = await Order.findOne({ _id: req.params.id, client: client._id })
    .populate('lines.product', 'name sku images');
  if (!order) throw new AppError('Order not found', 404);
  sendResponse(res, 200, order);
});

// My Quotations
exports.getMyQuotations = asyncHandler(async (req, res) => {
  const client = await getClientForUser(req.user._id);
  const total = await Quotation.countDocuments({ client: client._id });
  const features = new APIFeatures(Quotation.find({ client: client._id }), req.query).sort().paginate();
  const quotations = await features.query.select('quotationNumber status totalAmount validityDate currency lines');
  sendPaginatedResponse(res, 200, quotations, total, features.pagination);
});

// My Invoices
exports.getMyInvoices = asyncHandler(async (req, res) => {
  const client = await getClientForUser(req.user._id);
  const filter = { client: client._id };
  if (req.query.status) filter.status = req.query.status;

  const total = await Invoice.countDocuments(filter);
  const features = new APIFeatures(Invoice.find(filter), req.query).sort().paginate();
  const invoices = await features.query
    .select('invoiceNumber status totalAmount paidAmount balanceDue issueDate dueDate');
  sendPaginatedResponse(res, 200, invoices, total, features.pagination);
});

// My Invoice Detail
exports.getMyInvoice = asyncHandler(async (req, res) => {
  const client = await getClientForUser(req.user._id);
  const invoice = await Invoice.findOne({ _id: req.params.id, client: client._id })
    .populate('order', 'orderNumber');
  if (!invoice) throw new AppError('Invoice not found', 404);
  sendResponse(res, 200, invoice);
});

// Browse Product Catalogue
exports.browseCatalogue = asyncHandler(async (req, res) => {
  const filter = { status: 'active' };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.brand) filter.brand = req.query.brand;

  const total = await Product.countDocuments(filter);
  const features = new APIFeatures(Product.find(filter), req.query)
    .search(['name', 'sku', 'description', 'materialGrade'])
    .sort()
    .paginate();
  const products = await features.query
    .populate('category', 'name')
    .populate('brand', 'name')
    .select('name sku description images prices category brand materialGrade pressureRating unitOfMeasure complianceStandards');
  sendPaginatedResponse(res, 200, products, total, features.pagination);
});

// Submit RFQ
exports.submitRFQ = asyncHandler(async (req, res) => {
  const client = await getClientForUser(req.user._id);
  const { items, notes } = req.body;

  if (!items || !items.length) throw new AppError('Please add at least one product', 400);

  const lines = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new AppError(`Product not found: ${item.product}`, 404);
    const price = product.getPrice('QAR', client.pricingTier);
    lines.push({
      product: product._id,
      sku: product.sku,
      name: product.name,
      quantity: item.quantity,
      unitPrice: price,
      lineTotal: price * item.quantity,
    });
  }

  const orderNumber = await DocumentSequence.getNextNumber('order', 'ORD');
  const order = await Order.create({
    orderNumber,
    client: client._id,
    salesRep: client.primarySalesRep,
    lines,
    currency: 'QAR',
    taxRate: 5,
    status: 'rfq_received',
    clientNotes: notes,
  });

  sendResponse(res, 201, order, 'RFQ submitted successfully');
});

// My Profile
exports.getMyProfile = asyncHandler(async (req, res) => {
  const client = await getClientForUser(req.user._id);
  const contacts = await Contact.find({ client: client._id });
  sendResponse(res, 200, { ...client.toObject(), contacts });
});
