const Client = require('../models/Client');
const Contact = require('../models/Contact');
const Notification = require('../models/Notification');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler, sendResponse, sendPaginatedResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { CREDIT_ALERT_THRESHOLDS } = require('../config/constants');

exports.getClients = asyncHandler(async (req, res) => {
  const total = await Client.countDocuments();
  const features = new APIFeatures(Client.find(), req.query)
    .filter()
    .search(['companyName', 'crNumber', 'vatNumber'])
    .sort()
    .limitFields()
    .paginate();

  const clients = await features.query.populate('primarySalesRep', 'firstName lastName').populate('user', 'email');
  sendPaginatedResponse(res, 200, clients, total, features.pagination);
});

exports.getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id)
    .populate('primarySalesRep secondarySalesRep', 'firstName lastName email')
    .populate('contacts')
    .populate('user', 'email status lastLogin');

  if (!client) throw new AppError('Client not found', 404);
  sendResponse(res, 200, client);
});

exports.createClient = asyncHandler(async (req, res) => {
  const client = await Client.create(req.body);
  sendResponse(res, 201, client, 'Client created successfully');
});

exports.updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!client) throw new AppError('Client not found', 404);
  sendResponse(res, 200, client, 'Client updated successfully');
});

exports.deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) throw new AppError('Client not found', 404);
  sendResponse(res, 200, null, 'Client deleted successfully');
});

exports.updateClientStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const client = await Client.findById(req.params.id);
  if (!client) throw new AppError('Client not found', 404);

  client.statusHistory.push({ status, reason, changedBy: req.user._id });
  client.status = status;
  await client.save();
  sendResponse(res, 200, client, 'Client status updated');
});

exports.updateCreditLimit = asyncHandler(async (req, res) => {
  const { creditLimit } = req.body;
  const client = await Client.findByIdAndUpdate(req.params.id, { creditLimit }, { new: true });
  if (!client) throw new AppError('Client not found', 404);

  // Check and create alerts
  const utilization = client.creditUtilization;
  for (const threshold of CREDIT_ALERT_THRESHOLDS) {
    if (utilization >= threshold) {
      await Notification.create({
        user: client.primarySalesRep || req.user._id,
        title: `Credit limit alert: ${client.companyName}`,
        message: `Credit utilization at ${utilization}% (${threshold}% threshold)`,
        type: 'warning',
        entityType: 'Client',
        entityId: client._id,
      });
      break;
    }
  }
  sendResponse(res, 200, client, 'Credit limit updated');
});

// Contacts
exports.getContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({ client: req.params.id });
  sendResponse(res, 200, contacts);
});

exports.addContact = asyncHandler(async (req, res) => {
  const contact = await Contact.create({ ...req.body, client: req.params.id });
  sendResponse(res, 201, contact, 'Contact added');
});

exports.updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.contactId, req.body, { new: true });
  if (!contact) throw new AppError('Contact not found', 404);
  sendResponse(res, 200, contact, 'Contact updated');
});

exports.deleteContact = asyncHandler(async (req, res) => {
  await Contact.findByIdAndDelete(req.params.contactId);
  sendResponse(res, 200, null, 'Contact deleted');
});

// Documents
exports.addDocument = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw new AppError('Client not found', 404);

  if (req.file) {
    client.documents.push({
      name: req.body.name || req.file.originalname,
      type: req.body.type || 'other',
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
    });
    await client.save();
  }
  sendResponse(res, 200, client, 'Document uploaded');
});

// Bulk import
exports.bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload a file', 400);
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const results = { created: 0, errors: [] };
  for (const row of data) {
    try {
      await Client.create({
        companyName: row['Company Name'],
        crNumber: row['CR Number'],
        vatNumber: row['VAT Number'],
        segment: row['Segment'],
        territory: row['Territory'],
        status: row['Status'] || 'prospect',
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: row['Company Name'], error: err.message });
    }
  }
  sendResponse(res, 200, results, `Imported ${results.created} clients`);
});

exports.getClientStats = asyncHandler(async (req, res) => {
  const stats = await Client.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const bySegment = await Client.aggregate([
    { $group: { _id: '$segment', count: { $sum: 1 } } },
  ]);
  const byTerritory = await Client.aggregate([
    { $group: { _id: '$territory', count: { $sum: 1 } } },
  ]);
  sendResponse(res, 200, { byStatus: stats, bySegment, byTerritory });
});
