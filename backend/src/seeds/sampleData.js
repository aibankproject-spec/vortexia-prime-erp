require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

const User = require('../models/User');
const Client = require('../models/Client');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Opportunity = require('../models/Opportunity');
const Activity = require('../models/Activity');
const { Inventory, StockMovement, Warehouse } = require('../models/Inventory');
const SalesTarget = require('../models/SalesTarget');
const DocumentSequence = require('../models/DocumentSequence');
const Notification = require('../models/Notification');

const run = async () => {
  await connectDB();
  console.log('Adding 25+ sample records across all modules...\n');

  // Fetch existing refs
  const users = await User.find();
  const salesReps = users.filter(u => ['sales_rep', 'sales_manager'].includes(u.role));
  const adminUser = users.find(u => u.role === 'super_admin');
  const warehouseUser = users.find(u => u.role === 'warehouse');
  const financeUser = users.find(u => u.role === 'finance');
  const clients = await Client.find();
  const products = await Product.find();
  const warehouses = await Warehouse.find();

  if (!clients.length || !products.length) {
    console.error('Run the main seed first: npm run seed');
    process.exit(1);
  }

  // ─── 1. MORE CLIENTS (5 new) ───
  const newClients = [];
  const clientData = [
    { companyName: 'Ras Gas Company Ltd', crNumber: 'CR-RG-2004', vatNumber: 'VAT-RG-006', segment: 'Oil & Gas', territory: 'Qatar', creditLimit: 800000, paymentTerms: 'Net 60', pricingTier: 'platinum', status: 'active', primarySalesRep: salesReps[0]._id },
    { companyName: 'Dubai Drydocks World', crNumber: 'CR-DDW-2010', segment: 'Marine & Offshore', territory: 'UAE', creditLimit: 350000, paymentTerms: 'Net 30', pricingTier: 'gold', status: 'active', primarySalesRep: salesReps[1]?._id || salesReps[0]._id },
    { companyName: 'SABIC Industrial Polymers', crNumber: 'CR-SIP-2008', segment: 'Petrochemical', territory: 'Saudi Arabia', creditLimit: 600000, paymentTerms: 'Net 60', pricingTier: 'gold', status: 'active', primarySalesRep: salesReps[0]._id },
    { companyName: 'Bahrain Petroleum Co (BAPCO)', crNumber: 'CR-BAP-1999', segment: 'Oil & Gas', territory: 'Bahrain', creditLimit: 450000, paymentTerms: 'Net 90', pricingTier: 'platinum', status: 'active', primarySalesRep: salesReps[1]?._id || salesReps[0]._id },
    { companyName: 'Muscat Heavy Engineering', crNumber: 'CR-MHE-2015', segment: 'Construction', territory: 'Oman', creditLimit: 150000, paymentTerms: 'Net 30', pricingTier: 'silver', status: 'prospect', primarySalesRep: salesReps[0]._id },
  ];
  for (const c of clientData) {
    newClients.push(await Client.create(c));
  }
  const allClients = [...clients, ...newClients];
  console.log('✓ 5 new clients added');

  // ─── 2. MORE CONTACTS (5 new) ───
  await Contact.create([
    { client: newClients[0]._id, name: 'Hassan Al-Mansouri', designation: 'Procurement Director', email: 'hassan@rasgas.qa', phone: '+974-4444-3000', isPrimary: true },
    { client: newClients[1]._id, name: 'Ravi Shankar', designation: 'Engineering Manager', email: 'ravi@ddw.ae', phone: '+971-4-345-6000', isPrimary: true },
    { client: newClients[2]._id, name: 'Abdullah Al-Qahtani', designation: 'Plant Operations Head', email: 'abdullah@sabic.sa', phone: '+966-13-444-5000', isPrimary: true },
    { client: newClients[3]._id, name: 'Yousif Al-Doseri', designation: 'Technical Manager', email: 'yousif@bapco.bh', phone: '+973-1775-0000', isPrimary: true },
    { client: newClients[4]._id, name: 'Salim Al-Busaidi', designation: 'Purchasing Officer', email: 'salim@mhe.om', phone: '+968-2450-0000', isPrimary: true },
  ]);
  console.log('✓ 5 new contacts added');

  // ─── 3. QUOTATIONS (5) ───
  const quotations = [];
  const qtnData = [
    { client: allClients[0]._id, lines: [{ product: products[0]._id, sku: products[0].sku, name: products[0].name, quantity: 200, unitPrice: 185, discount: 5, lineTotal: 35150 }, { product: products[6]._id, sku: products[6].sku, name: products[6].name, quantity: 50, unitPrice: 450, discount: 0, lineTotal: 22500 }], validityDate: new Date('2026-04-30'), paymentTerms: 'Net 60', status: 'sent' },
    { client: allClients[1]._id, lines: [{ product: products[2]._id, sku: products[2].sku, name: products[2].name, quantity: 10, unitPrice: 2450, discount: 8, lineTotal: 22540 }], validityDate: new Date('2026-04-15'), status: 'draft' },
    { client: allClients[5]._id, lines: [{ product: products[4]._id, sku: products[4].sku, name: products[4].name, quantity: 4, unitPrice: 4200, discount: 0, lineTotal: 16800 }, { product: products[5]._id, sku: products[5].sku, name: products[5].name, quantity: 1, unitPrice: 28500, discount: 10, lineTotal: 25650 }], validityDate: new Date('2026-05-01'), status: 'sent', requiresApproval: true },
    { client: allClients[6]._id, lines: [{ product: products[1]._id, sku: products[1].sku, name: products[1].name, quantity: 500, unitPrice: 320, discount: 12, lineTotal: 140800 }], validityDate: new Date('2026-04-20'), status: 'accepted' },
    { client: allClients[7]._id, lines: [{ product: products[9]._id, sku: products[9].sku, name: products[9].name, quantity: 20, unitPrice: 1250, discount: 0, lineTotal: 25000 }, { product: products[7]._id, sku: products[7].sku, name: products[7].name, quantity: 15, unitPrice: 1850, discount: 5, lineTotal: 26362.5 }], validityDate: new Date('2026-04-10'), status: 'converted' },
  ];

  for (let i = 0; i < qtnData.length; i++) {
    const qNum = await DocumentSequence.getNextNumber('quotation', 'QTN');
    const q = await Quotation.create({
      ...qtnData[i],
      quotationNumber: qNum,
      salesRep: salesReps[i % salesReps.length]._id,
      currency: 'QAR',
      taxRate: 5,
      deliveryTerms: 'Ex-Works Doha',
    });
    quotations.push(q);
  }
  console.log('✓ 5 quotations created');

  // ─── 4. ORDERS (8) ───
  const orders = [];
  const orderStatuses = ['order_confirmed', 'picking_packing', 'dispatched', 'delivered', 'invoiced', 'payment_received', 'closed', 'rfq_received'];
  const orderDates = [
    new Date('2026-01-15'), new Date('2026-01-28'), new Date('2026-02-05'),
    new Date('2026-02-14'), new Date('2026-02-28'), new Date('2026-03-05'),
    new Date('2026-03-12'), new Date('2026-03-25'),
  ];

  for (let i = 0; i < 8; i++) {
    const client = allClients[i % allClients.length];
    const prod1 = products[i % products.length];
    const prod2 = products[(i + 3) % products.length];
    const qty1 = [50, 100, 25, 200, 10, 30, 75, 15][i];
    const qty2 = [20, 40, 10, 80, 5, 15, 30, 8][i];
    const price1 = prod1.prices[0]?.basePrice || 500;
    const price2 = prod2.prices[0]?.basePrice || 300;

    const oNum = await DocumentSequence.getNextNumber('order', 'ORD');
    const order = await Order.create({
      orderNumber: oNum,
      client: client._id,
      salesRep: salesReps[i % salesReps.length]._id,
      quotation: i < quotations.length ? quotations[i]._id : undefined,
      purchaseOrderNumber: `PO-${client.companyName.slice(0, 3).toUpperCase()}-2026-${String(i + 1).padStart(3, '0')}`,
      lines: [
        { product: prod1._id, sku: prod1.sku, name: prod1.name, quantity: qty1, unitPrice: price1, discount: [0, 5, 8, 3, 10, 0, 5, 0][i], lineTotal: qty1 * price1 * (1 - [0, 5, 8, 3, 10, 0, 5, 0][i] / 100) },
        { product: prod2._id, sku: prod2.sku, name: prod2.name, quantity: qty2, unitPrice: price2, discount: 0, lineTotal: qty2 * price2 },
      ],
      currency: 'QAR',
      taxRate: 5,
      status: orderStatuses[i],
      paymentStatus: ['payment_received', 'closed'].includes(orderStatuses[i]) ? 'paid' : (['invoiced', 'delivered'].includes(orderStatuses[i]) ? 'partial' : 'pending'),
      orderDate: orderDates[i],
      expectedDeliveryDate: new Date(orderDates[i].getTime() + 14 * 86400000),
      deliveryAddress: { street: 'Industrial Area', city: ['Doha', 'Dubai', 'Dammam', 'Manama', 'Muscat', 'Doha', 'Abu Dhabi', 'Doha'][i], country: ['Qatar', 'UAE', 'Saudi Arabia', 'Bahrain', 'Oman', 'Qatar', 'UAE', 'Qatar'][i] },
      internalNotes: `Sample order ${i + 1} for testing`,
      statusHistory: [{ status: orderStatuses[i], changedBy: adminUser._id, reason: 'Seeded data' }],
    });
    orders.push(order);
  }
  console.log('✓ 8 orders created');

  // ─── 5. INVOICES (5) ───
  const invoices = [];
  for (let i = 0; i < 5; i++) {
    const order = orders[i + 2]; // orders that are delivered/invoiced/paid
    const invNum = await DocumentSequence.getNextNumber('invoice', 'INV');
    const paidAmounts = [order.totalAmount, order.totalAmount * 0.6, order.totalAmount * 0.3, 0, order.totalAmount][i];
    const dueDate = new Date(order.orderDate.getTime() + [30, 60, 30, 90, 60][i] * 86400000);

    const inv = await Invoice.create({
      invoiceNumber: invNum,
      order: order._id,
      client: order.client,
      lines: order.lines.map(l => ({ product: l.product, description: l.name, quantity: l.quantity, unitPrice: l.unitPrice, discount: l.discount, lineTotal: l.lineTotal })),
      currency: 'QAR',
      taxRate: 5,
      issueDate: new Date(order.orderDate.getTime() + 7 * 86400000),
      dueDate,
      payments: paidAmounts > 0 ? [{ amount: paidAmounts, method: ['bank_transfer', 'cheque', 'bank_transfer', 'cash', 'lc'][i], reference: `PAY-2026-${String(i + 1).padStart(4, '0')}`, recordedBy: financeUser?._id || adminUser._id }] : [],
      companyDetails: { name: 'Vortexia Prime Trading', crNumber: 'CR-VPT-2006', vatNumber: 'VAT-VPT-001', address: 'West Bay, Doha, Qatar', phone: '+974-4444-0000', email: 'accounts@vortexia.com' },
    });
    invoices.push(inv);
  }
  console.log('✓ 5 invoices created');

  // ─── 6. OPPORTUNITIES (6) ───
  const oppData = [
    { title: 'QAFCO Ammonia Plant - Valve Replacement', client: allClients[0]._id, stage: 'proposal', probability: 60, expectedValue: 450000, source: 'existing_client', expectedCloseDate: new Date('2026-04-15') },
    { title: 'Dubai Marina Tower - Piping Supply', client: allClients[5]._id, stage: 'negotiation', probability: 75, expectedValue: 280000, source: 'referral', expectedCloseDate: new Date('2026-04-30') },
    { title: 'SABIC Jubail - Hydraulic System Upgrade', client: allClients[6]._id, stage: 'qualified', probability: 40, expectedValue: 620000, source: 'trade_show', expectedCloseDate: new Date('2026-05-20') },
    { title: 'BAPCO Refinery MRO Contract', client: allClients[7]._id, stage: 'won', probability: 100, expectedValue: 185000, source: 'existing_client', wonDate: new Date('2026-03-10'), expectedCloseDate: new Date('2026-03-10') },
    { title: 'Muscat Port Expansion - Fasteners', client: allClients[8]._id, stage: 'lead', probability: 15, expectedValue: 95000, source: 'cold_call', expectedCloseDate: new Date('2026-06-01') },
    { title: 'Qatar Gas - Instrumentation Package', client: allClients[0]._id, stage: 'lost', probability: 0, expectedValue: 340000, source: 'existing_client', lossReason: 'price', lossNotes: 'Competitor undercut by 18%', lostDate: new Date('2026-02-20'), expectedCloseDate: new Date('2026-02-15') },
  ];
  for (const opp of oppData) {
    await Opportunity.create({ ...opp, salesRep: salesReps[Math.floor(Math.random() * salesReps.length)]._id, currency: 'QAR' });
  }
  console.log('✓ 6 opportunities created');

  // ─── 7. ACTIVITIES (8) ───
  const actData = [
    { type: 'visit', title: 'Site visit at Qatar Energy', client: allClients[0]._id, description: 'Discussed upcoming valve replacement project. Client interested in Parker range.', isCompleted: true, completedAt: new Date('2026-03-15'), outcome: 'Positive - RFQ expected next week', duration: 120 },
    { type: 'call', title: 'Follow-up call with ADNOC', client: allClients[1]._id, description: 'Discussed quotation QTN-2026-00002 pricing', isCompleted: true, completedAt: new Date('2026-03-18'), outcome: 'Awaiting budget approval', duration: 30 },
    { type: 'email', title: 'Sent product catalogue to SABIC', client: allClients[6]._id, description: 'Sent updated hydraulic systems catalogue with 2026 pricing', isCompleted: true, completedAt: new Date('2026-03-20') },
    { type: 'demo', title: 'Product demo - Parker Hydraulics', client: allClients[5]._id, description: 'Live demonstration of Parker hydraulic power unit at client site', isCompleted: false, scheduledAt: new Date('2026-04-02'), duration: 180, location: 'Client premises, Dubai' },
    { type: 'meeting', title: 'Quarterly review with BAPCO', client: allClients[7]._id, description: 'Q1 performance review and Q2 forecast discussion', isCompleted: false, scheduledAt: new Date('2026-04-05'), followUpDate: new Date('2026-04-12'), followUpNotes: 'Prepare Q1 report and Q2 proposal' },
    { type: 'follow_up', title: 'Follow up on lost opportunity', client: allClients[0]._id, description: 'Re-engage on Qatar Gas instrumentation deal with revised pricing', isCompleted: false, scheduledAt: new Date('2026-04-01'), followUpDate: new Date('2026-04-08') },
    { type: 'visit', title: 'Warehouse tour for Muscat client', client: allClients[8]._id, description: 'Showing inventory and capabilities to potential new client', isCompleted: false, scheduledAt: new Date('2026-04-10'), location: 'Doha Main Warehouse' },
    { type: 'note', title: 'Competitor intelligence update', description: 'Emerson offering 15% discount on instrumentation in Qatar market. Consider adjusting strategy for Q2.', isCompleted: true, completedAt: new Date('2026-03-22') },
  ];
  for (const act of actData) {
    await Activity.create({ ...act, user: salesReps[Math.floor(Math.random() * salesReps.length)]._id });
  }
  console.log('✓ 8 activities created');

  // ─── 8. INVENTORY (10 records) ───
  const wh = warehouses[0];
  const wh2 = warehouses[1];
  for (let i = 0; i < products.length; i++) {
    const totalStock = [500, 300, 45, 22, 18, 5, 120, 35, 800, 60][i];
    const reserved = [80, 50, 10, 5, 4, 1, 20, 8, 100, 12][i];
    await Inventory.create({
      product: products[i]._id,
      warehouse: wh._id,
      totalStock,
      reservedStock: reserved,
      minStockLevel: Math.floor(totalStock * 0.15),
      reorderPoint: Math.floor(totalStock * 0.25),
      reorderQuantity: Math.floor(totalStock * 0.5),
      location: `Aisle ${String.fromCharCode(65 + (i % 6))}-Rack ${Math.floor(i / 2) + 1}`,
    });

    // Some products in second warehouse too
    if (i < 5) {
      await Inventory.create({
        product: products[i]._id,
        warehouse: wh2._id,
        totalStock: Math.floor(totalStock * 0.4),
        reservedStock: Math.floor(reserved * 0.3),
        minStockLevel: Math.floor(totalStock * 0.1),
        reorderPoint: Math.floor(totalStock * 0.15),
        location: `Bay ${i + 1}`,
      });
    }
  }
  console.log('✓ 15 inventory records created');

  // ─── 9. STOCK MOVEMENTS (5) ───
  const movementData = [
    { product: products[0]._id, warehouse: wh._id, type: 'receipt', quantity: 200, referenceNumber: 'GRN-2026-001', notes: 'Received from Swagelok supplier', performedBy: warehouseUser?._id || adminUser._id },
    { product: products[2]._id, warehouse: wh._id, type: 'issue', quantity: 10, referenceNumber: orders[0]?.orderNumber, referenceType: 'order', notes: 'Issued for order', performedBy: warehouseUser?._id || adminUser._id },
    { product: products[4]._id, warehouse: wh._id, type: 'receipt', quantity: 12, referenceNumber: 'GRN-2026-002', notes: 'Received from Parker distributor', performedBy: warehouseUser?._id || adminUser._id },
    { product: products[0]._id, warehouse: wh._id, type: 'transfer', quantity: 50, fromWarehouse: wh._id, toWarehouse: wh2._id, notes: 'Transfer to Dubai warehouse', performedBy: warehouseUser?._id || adminUser._id },
    { product: products[8]._id, warehouse: wh._id, type: 'adjustment', quantity: 780, referenceNumber: 'ADJ-2026-001', notes: 'Stock count adjustment after physical audit', performedBy: warehouseUser?._id || adminUser._id },
  ];
  for (const m of movementData) {
    await StockMovement.create(m);
  }
  console.log('✓ 5 stock movements created');

  // ─── 10. SALES TARGETS (4) ───
  for (const rep of salesReps) {
    await SalesTarget.create({ salesRep: rep._id, period: 'monthly', year: 2026, month: 3, targetAmount: [250000, 200000, 180000][salesReps.indexOf(rep)] || 150000, achievedAmount: [185000, 142000, 95000][salesReps.indexOf(rep)] || 80000, currency: 'QAR', territory: 'GCC', setBy: adminUser._id });
    await SalesTarget.create({ salesRep: rep._id, period: 'annual', year: 2026, targetAmount: [3000000, 2400000, 2000000][salesReps.indexOf(rep)] || 1500000, achievedAmount: [520000, 380000, 270000][salesReps.indexOf(rep)] || 200000, currency: 'QAR', setBy: adminUser._id });
  }
  console.log('✓ Sales targets created');

  // ─── 11. NOTIFICATIONS (5) ───
  await Notification.create([
    { user: adminUser._id, title: 'New order received', message: `Order ${orders[7]?.orderNumber || 'ORD-2026-00008'} received from ${allClients[7]?.companyName}`, type: 'order', entityType: 'Order', entityId: orders[7]?._id },
    { user: adminUser._id, title: 'Invoice overdue', message: `Invoice ${invoices[3]?.invoiceNumber || 'INV-2026-00004'} is past due date`, type: 'warning', entityType: 'Invoice', entityId: invoices[3]?._id },
    { user: salesReps[0]._id, title: 'Follow-up reminder', message: 'Follow up with Qatar Energy on valve replacement project - due tomorrow', type: 'info' },
    { user: adminUser._id, title: 'Low stock alert', message: 'Hydraulic Power Unit 15HP - only 5 units remaining in Doha warehouse', type: 'stock' },
    { user: salesReps[1]?._id || salesReps[0]._id, title: 'Quotation approved', message: `Quotation ${quotations[2]?.quotationNumber || 'QTN-2026-00003'} has been approved by manager`, type: 'success' },
  ]);
  console.log('✓ 5 notifications created');

  // Update client balances based on invoices
  for (const inv of invoices) {
    if (inv.balanceDue > 0) {
      await Client.findByIdAndUpdate(inv.client, { $inc: { currentBalance: inv.balanceDue } });
    }
  }
  console.log('✓ Client balances updated');

  console.log('\n✅ 25+ sample records added successfully!');
  console.log('   5 clients, 5 contacts, 5 quotations, 8 orders, 5 invoices');
  console.log('   6 opportunities, 8 activities, 15 inventory records');
  console.log('   5 stock movements, sales targets, 5 notifications\n');

  process.exit(0);
};

run().catch(err => { console.error('Error:', err); process.exit(1); });
