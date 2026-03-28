require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');

const User = require('../models/User');
const Role = require('../models/Role');
const Client = require('../models/Client');
const Contact = require('../models/Contact');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const { Warehouse } = require('../models/Inventory');
const DocumentSequence = require('../models/DocumentSequence');

const seed = async () => {
  await connectDB();
  console.log('Seeding database...\n');

  // Drop the entire database to clear stale indexes
  await mongoose.connection.dropDatabase();
  console.log('✓ Database dropped');

  // Roles
  const roles = await Role.insertMany([
    { name: 'super_admin', displayName: 'Super Admin', isSystem: true, permissions: { customers: ['view','create','edit','delete','approve','export'], products: ['view','create','edit','delete','approve','export'], orders: ['view','create','edit','delete','approve','export'], quotations: ['view','create','edit','delete','approve','export'], invoices: ['view','create','edit','delete','approve','export'], inventory: ['view','create','edit','delete','approve','export'], sales: ['view','create','edit','delete','approve','export'], reports: ['view','create','edit','delete','approve','export'], users: ['view','create','edit','delete','approve','export'], settings: ['view','create','edit','delete','approve','export'] } },
    { name: 'admin', displayName: 'Admin', isSystem: true, permissions: { customers: ['view','create','edit','delete','export'], products: ['view','create','edit','delete','export'], orders: ['view','create','edit','delete','approve','export'], quotations: ['view','create','edit','delete','approve','export'], invoices: ['view','create','edit','delete','export'], inventory: ['view','create','edit','delete','export'], sales: ['view','create','edit','export'], reports: ['view','export'], users: ['view','create','edit'] } },
    { name: 'sales_manager', displayName: 'Sales Manager', isSystem: true, permissions: { customers: ['view','create','edit','export'], products: ['view'], orders: ['view','create','edit','approve'], quotations: ['view','create','edit','approve'], sales: ['view','create','edit','export'], reports: ['view','export'] } },
    { name: 'sales_rep', displayName: 'Sales Representative', isSystem: true, permissions: { customers: ['view','create','edit'], products: ['view'], orders: ['view','create','edit'], quotations: ['view','create','edit'], sales: ['view','create','edit'] } },
    { name: 'warehouse', displayName: 'Warehouse Staff', isSystem: true, permissions: { products: ['view'], orders: ['view','edit'], inventory: ['view','create','edit'] } },
    { name: 'finance', displayName: 'Finance/Accounts', isSystem: true, permissions: { customers: ['view'], orders: ['view'], invoices: ['view','create','edit','approve','export'], reports: ['view','export'] } },
  ]);

  // Users
  const superAdmin = await User.create({ email: 'admin@vortexia.com', password: 'Admin@2026', firstName: 'Super', lastName: 'Admin', role: 'super_admin', status: 'active' });
  const adminUser = await User.create({ email: 'ops@vortexia.com', password: 'Admin@2026', firstName: 'Operations', lastName: 'Manager', role: 'admin', status: 'active' });
  const salesMgr = await User.create({ email: 'sales.mgr@vortexia.com', password: 'Sales@2026', firstName: 'Ahmed', lastName: 'Al-Rashid', role: 'sales_manager', status: 'active' });
  const salesRep1 = await User.create({ email: 'khalid@vortexia.com', password: 'Sales@2026', firstName: 'Khalid', lastName: 'Hassan', role: 'sales_rep', status: 'active' });
  const salesRep2 = await User.create({ email: 'fatima@vortexia.com', password: 'Sales@2026', firstName: 'Fatima', lastName: 'Al-Sayed', role: 'sales_rep', status: 'active' });
  const warehouseUser = await User.create({ email: 'warehouse@vortexia.com', password: 'Ware@2026', firstName: 'Mohammed', lastName: 'Ibrahim', role: 'warehouse', status: 'active' });
  const financeUser = await User.create({ email: 'finance@vortexia.com', password: 'Finance@2026', firstName: 'Sara', lastName: 'Ahmed', role: 'finance', status: 'active' });
  const clientUser = await User.create({ email: 'client@qatarenergy.com', password: 'Client@2026', firstName: 'Omar', lastName: 'Al-Thani', role: 'client', status: 'active' });

  console.log('✓ Users created');

  // Categories (4-level hierarchy)
  const piping = await Category.create({ name: 'Piping', level: 0, sortOrder: 1, attributeSet: [{ name: 'Material Grade', type: 'select', options: ['Carbon Steel', 'Stainless Steel', 'Alloy Steel', 'Duplex'], required: true }, { name: 'Schedule', type: 'select', options: ['SCH 10', 'SCH 20', 'SCH 40', 'SCH 80', 'SCH 160'] }, { name: 'Nominal Bore', type: 'text' }, { name: 'Pressure Class', type: 'select', options: ['150#', '300#', '600#', '900#', '1500#', '2500#'] }] });
  const valves = await Category.create({ name: 'Valves', level: 0, sortOrder: 2, attributeSet: [{ name: 'Size', type: 'text', required: true }, { name: 'Pressure Rating', type: 'select', options: ['150#', '300#', '600#', '900#', '1500#'] }, { name: 'Body Material', type: 'select', options: ['Carbon Steel', 'Stainless Steel', 'Cast Iron', 'Bronze'] }, { name: 'End Connection', type: 'select', options: ['Flanged', 'Threaded', 'Socket Weld', 'Butt Weld'] }] });
  const hydraulics = await Category.create({ name: 'Hydraulics & Pneumatics', level: 0, sortOrder: 3, attributeSet: [{ name: 'Operating Pressure', type: 'text' }, { name: 'Flow Rate', type: 'text' }, { name: 'Port Size', type: 'text' }, { name: 'Mounting Style', type: 'text' }] });
  const hose = await Category.create({ name: 'Hose Management', level: 0, sortOrder: 4 });
  const filtration = await Category.create({ name: 'Filtration Systems', level: 0, sortOrder: 5 });
  const instrumentation = await Category.create({ name: 'Instrumentation', level: 0, sortOrder: 6 });
  const welding = await Category.create({ name: 'Welding & Coating', level: 0, sortOrder: 7 });
  const oil = await Category.create({ name: 'Oil & Lubrication', level: 0, sortOrder: 8 });
  const electro = await Category.create({ name: 'Electro-Mechanical', level: 0, sortOrder: 9 });
  const lifting = await Category.create({ name: 'Lifting Equipment', level: 0, sortOrder: 10 });
  const steel = await Category.create({ name: 'Steel Fabrication', level: 0, sortOrder: 11 });
  const fasteners = await Category.create({ name: 'Fasteners & Fittings', level: 0, sortOrder: 12 });

  // Sub-categories
  const seamlessPipes = await Category.create({ name: 'Seamless Pipes', parent: piping._id, level: 1 });
  const erwTubes = await Category.create({ name: 'ERW Tubes', parent: piping._id, level: 1 });
  const pipeFittings = await Category.create({ name: 'Pipe Fittings', parent: piping._id, level: 1 });
  const flanges = await Category.create({ name: 'Flanges', parent: piping._id, level: 1 });
  const gateValves = await Category.create({ name: 'Gate Valves', parent: valves._id, level: 1 });
  const ballValves = await Category.create({ name: 'Ball Valves', parent: valves._id, level: 1 });
  const checkValves = await Category.create({ name: 'Check Valves', parent: valves._id, level: 1 });
  const butterflyValves = await Category.create({ name: 'Butterfly Valves', parent: valves._id, level: 1 });
  const cylinders = await Category.create({ name: 'Hydraulic Cylinders', parent: hydraulics._id, level: 1 });
  const powerUnits = await Category.create({ name: 'Power Units', parent: hydraulics._id, level: 1 });

  console.log('✓ Categories created');

  // Brands (use create() individually so pre-save slug hook fires)
  const brandData = [
    { name: 'Parker Hannifin', isAuthorizedDistributor: true, website: 'https://parker.com' },
    { name: 'Swagelok', isAuthorizedDistributor: true },
    { name: 'Danfoss', isAuthorizedDistributor: true },
    { name: 'Bosch Rexroth', isAuthorizedDistributor: true },
    { name: 'Emerson', isAuthorizedDistributor: true },
    { name: 'Honeywell', isAuthorizedDistributor: false },
    { name: 'Siemens', isAuthorizedDistributor: false },
    { name: 'Cameron SLB', isAuthorizedDistributor: true },
    { name: 'Flowserve', isAuthorizedDistributor: true },
    { name: 'IMI Hydronic', isAuthorizedDistributor: true },
  ];
  const brands = [];
  for (const b of brandData) {
    brands.push(await Brand.create(b));
  }
  console.log('✓ Brands created');

  // Products (use create() individually so pre-save slug hook fires)
  const productData = [
    { sku: 'PIP-SM-CS-001', name: 'Carbon Steel Seamless Pipe 2in SCH 40', category: seamlessPipes._id, brand: brands[1]._id, unitOfMeasure: 'MTR', materialGrade: 'ASTM A106 Gr.B', pressureRating: 'SCH 40', complianceStandards: ['ASTM', 'ASME'], status: 'active', prices: [{ currency: 'QAR', basePrice: 185 }, { currency: 'USD', basePrice: 50.80 }], tierPricing: [{ tier: 'gold', currency: 'QAR', price: 170 }, { tier: 'platinum', currency: 'QAR', price: 160 }], description: 'Premium quality carbon steel seamless pipe suitable for high-pressure applications in oil & gas industry.' },
    { sku: 'PIP-SM-SS-001', name: 'Stainless Steel 316L Seamless Pipe 1in SCH 10S', category: seamlessPipes._id, brand: brands[1]._id, unitOfMeasure: 'MTR', materialGrade: 'ASTM A312 TP316L', pressureRating: 'SCH 10S', complianceStandards: ['ASTM', 'ASME'], status: 'active', prices: [{ currency: 'QAR', basePrice: 320 }] },
    { sku: 'VLV-GT-CS-001', name: 'Gate Valve 4in 150 Carbon Steel', category: gateValves._id, brand: brands[7]._id, unitOfMeasure: 'PCS', materialGrade: 'ASTM A216 WCB', pressureRating: '150#', complianceStandards: ['API', 'ASME'], status: 'active', prices: [{ currency: 'QAR', basePrice: 2450 }, { currency: 'USD', basePrice: 672 }], description: 'API 600 flanged gate valve for isolation service in petrochemical and refinery applications.' },
    { sku: 'VLV-BL-SS-001', name: 'Ball Valve 2in 300 Stainless Steel', category: ballValves._id, brand: brands[8]._id, unitOfMeasure: 'PCS', materialGrade: 'ASTM A351 CF8M', pressureRating: '300#', complianceStandards: ['API', 'ASME'], status: 'active', prices: [{ currency: 'QAR', basePrice: 3800 }] },
    { sku: 'HYD-CYL-001', name: 'Double Acting Hydraulic Cylinder 50mm Bore', category: cylinders._id, brand: brands[0]._id, unitOfMeasure: 'PCS', pressureRating: '210 bar', complianceStandards: ['ISO'], status: 'active', prices: [{ currency: 'QAR', basePrice: 4200 }], description: 'Parker hydraulic cylinder with Chrome plated piston rod, suitable for industrial automation.' },
    { sku: 'HYD-PU-001', name: 'Hydraulic Power Unit 15HP', category: powerUnits._id, brand: brands[3]._id, unitOfMeasure: 'SET', complianceStandards: ['ISO'], status: 'active', prices: [{ currency: 'QAR', basePrice: 28500 }] },
    { sku: 'FLG-WN-CS-001', name: 'Weld Neck Flange 6in 150 CS', category: flanges._id, brand: brands[1]._id, unitOfMeasure: 'PCS', materialGrade: 'ASTM A105', pressureRating: '150#', complianceStandards: ['ASME', 'ASTM'], status: 'active', prices: [{ currency: 'QAR', basePrice: 450 }] },
    { sku: 'VLV-CK-CS-001', name: 'Swing Check Valve 3in 150 CS', category: checkValves._id, brand: brands[8]._id, unitOfMeasure: 'PCS', materialGrade: 'ASTM A216 WCB', pressureRating: '150#', complianceStandards: ['API'], status: 'active', prices: [{ currency: 'QAR', basePrice: 1850 }] },
    { sku: 'FIT-ELB-SS-001', name: 'SS 316L 90deg Elbow 2in SCH 40S', category: pipeFittings._id, unitOfMeasure: 'PCS', materialGrade: 'ASTM A403 WP316L', complianceStandards: ['ASTM', 'ASME'], status: 'active', prices: [{ currency: 'QAR', basePrice: 95 }] },
    { sku: 'VLV-BF-CI-001', name: 'Butterfly Valve 8in Wafer Type', category: butterflyValves._id, brand: brands[4]._id, unitOfMeasure: 'PCS', pressureRating: '150#', complianceStandards: ['API'], status: 'active', isFeatured: true, prices: [{ currency: 'QAR', basePrice: 1250 }] },
  ];
  const products = [];
  for (const p of productData) {
    products.push(await Product.create(p));
  }
  console.log('✓ Products created');

  // Warehouses
  await Warehouse.insertMany([
    { name: 'Doha Main Warehouse', code: 'WH-DOH', address: { city: 'Doha', country: 'Qatar' }, manager: warehouseUser._id },
    { name: 'Dubai Distribution Center', code: 'WH-DXB', address: { city: 'Dubai', country: 'UAE' } },
  ]);
  console.log('✓ Warehouses created');

  // Clients
  const clients = await Client.insertMany([
    { companyName: 'Qatar Energy', crNumber: 'CR-QE-2001', vatNumber: 'VAT-QE-001', segment: 'Oil & Gas', territory: 'Qatar', creditLimit: 500000, paymentTerms: 'Net 60', pricingTier: 'platinum', status: 'active', user: clientUser._id, primarySalesRep: salesRep1._id },
    { companyName: 'ADNOC Group', crNumber: 'CR-AD-1998', vatNumber: 'VAT-AD-002', segment: 'Oil & Gas', territory: 'UAE', creditLimit: 750000, paymentTerms: 'Net 60', pricingTier: 'platinum', status: 'active', primarySalesRep: salesRep2._id },
    { companyName: 'Gulf Petrochemical Industries', crNumber: 'CR-GPI-2005', segment: 'Petrochemical', territory: 'Bahrain', creditLimit: 200000, paymentTerms: 'Net 30', pricingTier: 'gold', status: 'active', primarySalesRep: salesRep1._id },
    { companyName: 'Al Jazeera Marine Services', segment: 'Marine & Offshore', territory: 'Qatar', creditLimit: 100000, paymentTerms: 'Net 30', pricingTier: 'silver', status: 'active', primarySalesRep: salesRep2._id },
    { companyName: 'Saudi Aramco Contractors WLL', segment: 'EPC Contractor', territory: 'Saudi Arabia', creditLimit: 1000000, paymentTerms: 'Net 90', pricingTier: 'platinum', status: 'prospect', primarySalesRep: salesMgr._id },
  ]);

  // Contacts
  await Contact.insertMany([
    { client: clients[0]._id, name: 'Omar Al-Thani', designation: 'Procurement Manager', email: 'omar@qatarenergy.com', phone: '+974-4444-1111', isPrimary: true },
    { client: clients[0]._id, name: 'Ali Hassan', designation: 'Technical Engineer', email: 'ali@qatarenergy.com', phone: '+974-4444-2222' },
    { client: clients[1]._id, name: 'Rashid Al-Falasi', designation: 'Supply Chain Director', email: 'rashid@adnoc.ae', phone: '+971-2-611-0000', isPrimary: true },
    { client: clients[2]._id, name: 'Yusuf Al-Bahraini', designation: 'Plant Manager', email: 'yusuf@gpic.com', isPrimary: true },
  ]);
  console.log('✓ Clients & Contacts created');

  // Document sequences
  await DocumentSequence.insertMany([
    { type: 'order', prefix: 'ORD', currentNumber: 0, year: 2026 },
    { type: 'quotation', prefix: 'QTN', currentNumber: 0, year: 2026 },
    { type: 'invoice', prefix: 'INV', currentNumber: 0, year: 2026 },
    { type: 'delivery_note', prefix: 'DN', currentNumber: 0, year: 2026 },
    { type: 'credit_note', prefix: 'CN', currentNumber: 0, year: 2026 },
    { type: 'ticket', prefix: 'TKT', currentNumber: 0, year: 2026 },
  ]);
  console.log('✓ Document sequences created');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Login Credentials:');
  console.log('  Super Admin: admin@vortexia.com / Admin@2026');
  console.log('  Admin:       ops@vortexia.com / Admin@2026');
  console.log('  Sales Mgr:   sales.mgr@vortexia.com / Sales@2026');
  console.log('  Sales Rep:   khalid@vortexia.com / Sales@2026');
  console.log('  Client:      client@qatarenergy.com / Client@2026\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
