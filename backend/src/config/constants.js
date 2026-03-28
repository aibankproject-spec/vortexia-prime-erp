module.exports = {
  USER_ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    SALES_MANAGER: 'sales_manager',
    SALES_REP: 'sales_rep',
    WAREHOUSE: 'warehouse',
    FINANCE: 'finance',
    CLIENT: 'client',
    GUEST: 'guest',
  },

  CLIENT_STATUS: ['prospect', 'active', 'on-hold', 'dormant', 'blacklisted'],

  CLIENT_SEGMENTS: [
    'Oil & Gas',
    'Petrochemical',
    'Marine & Offshore',
    'Construction',
    'Power Generation',
    'Manufacturing',
    'EPC Contractor',
    'Government',
    'Other',
  ],

  TERRITORIES: ['Qatar', 'UAE', 'Saudi Arabia', 'Bahrain', 'Kuwait', 'Oman', 'Other'],

  PAYMENT_TERMS: ['Net 30', 'Net 60', 'Net 90', 'LC', 'Advance', 'COD', 'Custom'],

  CURRENCIES: ['QAR', 'AED', 'USD', 'EUR', 'SAR'],

  PRODUCT_STATUS: ['active', 'discontinued', 'out-of-stock', 'coming-soon'],

  ORDER_STATUS: [
    'rfq_received',
    'quotation_prepared',
    'quotation_sent',
    'negotiation',
    'po_received',
    'order_confirmed',
    'picking_packing',
    'dispatched',
    'delivered',
    'invoiced',
    'payment_received',
    'closed',
    'cancelled',
  ],

  QUOTATION_STATUS: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'],

  INVOICE_STATUS: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'],

  PAYMENT_STATUS: ['pending', 'partial', 'paid', 'overdue', 'refunded'],

  OPPORTUNITY_STAGES: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],

  ACTIVITY_TYPES: ['call', 'email', 'meeting', 'visit', 'demo', 'follow_up', 'note'],

  DOCUMENT_TYPES: [
    'quotation',
    'proforma_invoice',
    'order_confirmation',
    'delivery_note',
    'tax_invoice',
    'credit_note',
  ],

  STOCK_MOVEMENT_TYPES: ['receipt', 'issue', 'transfer', 'adjustment', 'return'],

  COMPLIANCE_STANDARDS: ['API', 'ASME', 'ISO', 'ASTM', 'DIN', 'BS', 'EN', 'JIS'],

  CREDIT_ALERT_THRESHOLDS: [80, 90, 100],
};
