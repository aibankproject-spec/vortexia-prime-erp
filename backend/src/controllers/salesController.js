const Opportunity = require('../models/Opportunity');
const Activity = require('../models/Activity');
const SalesTarget = require('../models/SalesTarget');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler, sendResponse, sendPaginatedResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// Opportunities
exports.getOpportunities = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.salesRep) filter.salesRep = req.query.salesRep;
  if (req.user.role === 'sales_rep') filter.salesRep = req.user._id;

  const total = await Opportunity.countDocuments(filter);
  const features = new APIFeatures(Opportunity.find(filter), req.query).sort().paginate();
  const opportunities = await features.query
    .populate('client', 'companyName')
    .populate('salesRep', 'firstName lastName');
  sendPaginatedResponse(res, 200, opportunities, total, features.pagination);
});

exports.getOpportunity = asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id)
    .populate('client', 'companyName segment territory')
    .populate('salesRep', 'firstName lastName')
    .populate('quotation')
    .populate('order');
  if (!opp) throw new AppError('Opportunity not found', 404);
  sendResponse(res, 200, opp);
});

exports.createOpportunity = asyncHandler(async (req, res) => {
  const opp = await Opportunity.create({ ...req.body, salesRep: req.body.salesRep || req.user._id });
  sendResponse(res, 201, opp, 'Opportunity created');
});

exports.updateOpportunity = asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) throw new AppError('Opportunity not found', 404);

  if (req.body.stage && req.body.stage !== opp.stage) {
    opp.stageHistory.push({ stage: req.body.stage, changedBy: req.user._id });
    if (req.body.stage === 'won') opp.wonDate = new Date();
    if (req.body.stage === 'lost') opp.lostDate = new Date();
  }

  Object.assign(opp, req.body);
  await opp.save();
  sendResponse(res, 200, opp, 'Opportunity updated');
});

exports.deleteOpportunity = asyncHandler(async (req, res) => {
  await Opportunity.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'Opportunity deleted');
});

exports.getPipeline = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'sales_rep') filter.salesRep = req.user._id;

  const pipeline = await Opportunity.aggregate([
    { $match: filter },
    { $group: {
      _id: '$stage',
      count: { $sum: 1 },
      totalValue: { $sum: '$expectedValue' },
      weightedValue: { $sum: { $multiply: ['$expectedValue', { $divide: ['$probability', 100] }] } },
    }},
    { $sort: { _id: 1 } },
  ]);
  sendResponse(res, 200, pipeline);
});

// Activities
exports.getActivities = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.client) filter.client = req.query.client;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.user) filter.user = req.query.user;
  if (req.user.role === 'sales_rep') filter.user = req.user._id;

  const total = await Activity.countDocuments(filter);
  const features = new APIFeatures(Activity.find(filter), req.query).sort().paginate();
  const activities = await features.query
    .populate('user', 'firstName lastName')
    .populate('client', 'companyName');
  sendPaginatedResponse(res, 200, activities, total, features.pagination);
});

exports.createActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.create({ ...req.body, user: req.user._id });
  sendResponse(res, 201, activity, 'Activity logged');
});

exports.updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!activity) throw new AppError('Activity not found', 404);
  sendResponse(res, 200, activity, 'Activity updated');
});

// Sales Targets
exports.getSalesTargets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.salesRep) filter.salesRep = req.query.salesRep;
  if (req.query.year) filter.year = parseInt(req.query.year);
  if (req.query.period) filter.period = req.query.period;

  const targets = await SalesTarget.find(filter)
    .populate('salesRep', 'firstName lastName')
    .sort('-year -month');
  sendResponse(res, 200, targets);
});

exports.setSalesTarget = asyncHandler(async (req, res) => {
  const target = await SalesTarget.findOneAndUpdate(
    { salesRep: req.body.salesRep, period: req.body.period, year: req.body.year, month: req.body.month, quarter: req.body.quarter },
    { ...req.body, setBy: req.user._id },
    { upsert: true, new: true }
  );
  sendResponse(res, 200, target, 'Sales target set');
});

// Upcoming follow-ups
exports.getFollowUps = asyncHandler(async (req, res) => {
  const filter = {
    isCompleted: false,
    followUpDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  };
  if (req.user.role === 'sales_rep') filter.user = req.user._id;

  const followUps = await Activity.find(filter)
    .populate('client', 'companyName')
    .populate('user', 'firstName lastName')
    .sort('followUpDate');
  sendResponse(res, 200, followUps);
});
