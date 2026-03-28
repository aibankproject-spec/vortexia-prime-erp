const Order = require('../models/Order');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Opportunity = require('../models/Opportunity');
const Quotation = require('../models/Quotation');
const { asyncHandler, sendResponse } = require('../utils/helpers');
const mongoose = require('mongoose');

// Client Reports
exports.clientRevenueSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, segment, territory } = req.query;
  const match = {};
  if (startDate && endDate) match.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

  const data = await Order.aggregate([
    { $match: { ...match, status: { $nin: ['cancelled'] } } },
    { $group: {
      _id: '$client',
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: '$totalAmount' },
      avgOrderValue: { $avg: '$totalAmount' },
      lastOrderDate: { $max: '$orderDate' },
    }},
    { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
    { $unwind: '$client' },
    ...(segment ? [{ $match: { 'client.segment': segment } }] : []),
    ...(territory ? [{ $match: { 'client.territory': territory } }] : []),
    { $project: {
      companyName: '$client.companyName',
      segment: '$client.segment',
      territory: '$client.territory',
      totalOrders: 1, totalRevenue: 1, avgOrderValue: 1, lastOrderDate: 1,
      currentBalance: '$client.currentBalance',
    }},
    { $sort: { totalRevenue: -1 } },
  ]);
  sendResponse(res, 200, data);
});

exports.clientAgingReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const data = await Invoice.aggregate([
    { $match: { status: { $in: ['sent', 'partially_paid', 'overdue'] } } },
    { $group: {
      _id: '$client',
      current: { $sum: { $cond: [{ $gte: ['$dueDate', now] }, '$balanceDue', 0] } },
      days30: { $sum: { $cond: [{ $and: [{ $lt: ['$dueDate', now] }, { $gte: ['$dueDate', new Date(now - 30 * 86400000)] }] }, '$balanceDue', 0] } },
      days60: { $sum: { $cond: [{ $and: [{ $lt: ['$dueDate', new Date(now - 30 * 86400000)] }, { $gte: ['$dueDate', new Date(now - 60 * 86400000)] }] }, '$balanceDue', 0] } },
      days90: { $sum: { $cond: [{ $and: [{ $lt: ['$dueDate', new Date(now - 60 * 86400000)] }, { $gte: ['$dueDate', new Date(now - 90 * 86400000)] }] }, '$balanceDue', 0] } },
      over120: { $sum: { $cond: [{ $lt: ['$dueDate', new Date(now - 120 * 86400000)] }, '$balanceDue', 0] } },
      totalOutstanding: { $sum: '$balanceDue' },
    }},
    { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
    { $unwind: '$client' },
    { $project: { companyName: '$client.companyName', current: 1, days30: 1, days60: 1, days90: 1, over120: 1, totalOutstanding: 1 } },
    { $sort: { totalOutstanding: -1 } },
  ]);
  sendResponse(res, 200, data);
});

// Product Reports
exports.productSalesSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, category, brand } = req.query;
  const match = { status: { $nin: ['cancelled'] } };
  if (startDate && endDate) match.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

  const data = await Order.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    { $group: {
      _id: '$lines.product',
      totalQtySold: { $sum: '$lines.quantity' },
      totalRevenue: { $sum: '$lines.lineTotal' },
      orderCount: { $sum: 1 },
    }},
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    ...(category ? [{ $match: { 'product.category': new mongoose.Types.ObjectId(category) } }] : []),
    { $project: {
      name: '$product.name', sku: '$product.sku',
      totalQtySold: 1, totalRevenue: 1, orderCount: 1,
    }},
    { $sort: { totalRevenue: -1 } },
    { $limit: parseInt(req.query.limit) || 50 },
  ]);
  sendResponse(res, 200, data);
});

exports.slowMovingProducts = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const cutoff = new Date(Date.now() - days * 86400000);

  const soldProducts = await Order.aggregate([
    { $match: { orderDate: { $gte: cutoff }, status: { $nin: ['cancelled'] } } },
    { $unwind: '$lines' },
    { $group: { _id: '$lines.product', qtySold: { $sum: '$lines.quantity' } } },
  ]);

  const soldIds = soldProducts.map(p => p._id);
  const slowMoving = await Product.find({ _id: { $nin: soldIds }, status: 'active' })
    .select('name sku category brand')
    .populate('category', 'name')
    .populate('brand', 'name')
    .limit(100);
  sendResponse(res, 200, slowMoving);
});

// Sales Reports
exports.salesRepPerformance = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const match = { status: { $nin: ['cancelled'] } };
  if (year) {
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${parseInt(year) + 1}-01-01`);
    match.orderDate = { $gte: startOfYear, $lt: endOfYear };
  }

  const data = await Order.aggregate([
    { $match: match },
    { $group: {
      _id: '$salesRep',
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: '$totalAmount' },
      avgDealSize: { $avg: '$totalAmount' },
    }},
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'rep' } },
    { $unwind: '$rep' },
    { $project: {
      name: { $concat: ['$rep.firstName', ' ', '$rep.lastName'] },
      totalOrders: 1, totalRevenue: 1, avgDealSize: 1,
    }},
    { $sort: { totalRevenue: -1 } },
  ]);

  // Get quotation conversion rates
  for (const rep of data) {
    const quotations = await Quotation.countDocuments({ salesRep: rep._id });
    const converted = await Quotation.countDocuments({ salesRep: rep._id, status: 'converted' });
    rep.quotationsSent = quotations;
    rep.quotationsConverted = converted;
    rep.conversionRate = quotations ? Math.round((converted / quotations) * 100) : 0;
  }

  sendResponse(res, 200, data);
});

exports.quotationConversion = asyncHandler(async (req, res) => {
  const { salesRep, startDate, endDate } = req.query;
  const match = {};
  if (salesRep) match.salesRep = new mongoose.Types.ObjectId(salesRep);
  if (startDate && endDate) match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };

  const data = await Quotation.aggregate([
    { $match: match },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      totalValue: { $sum: '$totalAmount' },
    }},
  ]);
  sendResponse(res, 200, data);
});

// Dashboard KPIs
exports.dashboardKPIs = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [revenueToday, revenueMTD, revenueYTD, totalClients, activeOrders, pipelineValue, pendingInvoices] = await Promise.all([
    Order.aggregate([{ $match: { orderDate: { $gte: startOfDay }, status: { $nin: ['cancelled'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([{ $match: { orderDate: { $gte: startOfMonth }, status: { $nin: ['cancelled'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([{ $match: { orderDate: { $gte: startOfYear }, status: { $nin: ['cancelled'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Client.countDocuments({ status: 'active' }),
    Order.countDocuments({ status: { $nin: ['closed', 'cancelled', 'payment_received'] } }),
    Opportunity.aggregate([{ $match: { stage: { $nin: ['won', 'lost'] } } }, { $group: { _id: null, total: { $sum: { $multiply: ['$expectedValue', { $divide: ['$probability', 100] }] } } } }]),
    Invoice.aggregate([{ $match: { status: { $in: ['sent', 'partially_paid', 'overdue'] } } }, { $group: { _id: null, total: { $sum: '$balanceDue' } } }]),
  ]);

  sendResponse(res, 200, {
    revenueToday: revenueToday[0]?.total || 0,
    revenueMTD: revenueMTD[0]?.total || 0,
    revenueYTD: revenueYTD[0]?.total || 0,
    totalClients,
    activeOrders,
    pipelineValue: pipelineValue[0]?.total || 0,
    pendingInvoices: pendingInvoices[0]?.total || 0,
  });
});

exports.revenueTrend = asyncHandler(async (req, res) => {
  const { period = 'monthly', year } = req.query;
  const yr = parseInt(year) || new Date().getFullYear();

  let groupBy;
  if (period === 'daily') groupBy = { $dayOfMonth: '$orderDate' };
  else if (period === 'weekly') groupBy = { $week: '$orderDate' };
  else if (period === 'quarterly') groupBy = { $ceil: { $divide: [{ $month: '$orderDate' }, 3] } };
  else groupBy = { $month: '$orderDate' };

  const data = await Order.aggregate([
    { $match: {
      orderDate: { $gte: new Date(`${yr}-01-01`), $lt: new Date(`${yr + 1}-01-01`) },
      status: { $nin: ['cancelled'] },
    }},
    { $group: { _id: groupBy, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  sendResponse(res, 200, data);
});
