const mongoose = require('mongoose');

const salesTargetSchema = new mongoose.Schema(
  {
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, enum: ['monthly', 'quarterly', 'annual'], required: true },
    year: { type: Number, required: true },
    month: { type: Number },
    quarter: { type: Number },
    targetAmount: { type: Number, required: true },
    achievedAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'QAR' },
    territory: String,
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

salesTargetSchema.virtual('achievementPercentage').get(function () {
  if (!this.targetAmount) return 0;
  return Math.round((this.achievedAmount / this.targetAmount) * 100);
});

salesTargetSchema.index({ salesRep: 1, year: 1, period: 1 });

module.exports = mongoose.model('SalesTarget', salesTargetSchema);
