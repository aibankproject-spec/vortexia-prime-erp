const mongoose = require('mongoose');
const { OPPORTUNITY_STAGES, CURRENCIES } = require('../config/constants');

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },

    stage: { type: String, enum: OPPORTUNITY_STAGES, default: 'lead' },
    probability: { type: Number, default: 10, min: 0, max: 100 },
    expectedValue: { type: Number, default: 0 },
    currency: { type: String, enum: CURRENCIES, default: 'QAR' },
    expectedCloseDate: Date,

    source: { type: String, enum: ['website', 'referral', 'trade_show', 'cold_call', 'email', 'existing_client', 'other'] },
    description: String,

    // Competitor tracking
    competitors: [{
      name: String,
      product: String,
      quotedPrice: Number,
      notes: String,
    }],

    // Win/Loss
    lossReason: { type: String, enum: ['price', 'competitor', 'spec_mismatch', 'delivery_time', 'budget', 'no_response', 'other'] },
    lossNotes: String,
    wonDate: Date,
    lostDate: Date,

    // Linked
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

    stageHistory: [{
      stage: String,
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now },
    }],

    tags: [String],
  },
  { timestamps: true }
);

opportunitySchema.index({ salesRep: 1, stage: 1 });
opportunitySchema.index({ client: 1 });
opportunitySchema.index({ stage: 1 });
opportunitySchema.index({ expectedCloseDate: 1 });

module.exports = mongoose.model('Opportunity', opportunitySchema);
