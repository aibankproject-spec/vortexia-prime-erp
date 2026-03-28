const User = require('./User');
const Role = require('./Role');
const Client = require('./Client');
const Contact = require('./Contact');
const Category = require('./Category');
const Brand = require('./Brand');
const Product = require('./Product');
const { Inventory, StockMovement, Warehouse } = require('./Inventory');
const Order = require('./Order');
const Quotation = require('./Quotation');
const Invoice = require('./Invoice');
const Opportunity = require('./Opportunity');
const Activity = require('./Activity');
const SalesTarget = require('./SalesTarget');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const DocumentSequence = require('./DocumentSequence');
const SupportTicket = require('./SupportTicket');

module.exports = {
  User,
  Role,
  Client,
  Contact,
  Category,
  Brand,
  Product,
  Inventory,
  StockMovement,
  Warehouse,
  Order,
  Quotation,
  Invoice,
  Opportunity,
  Activity,
  SalesTarget,
  AuditLog,
  Notification,
  DocumentSequence,
  SupportTicket,
};
