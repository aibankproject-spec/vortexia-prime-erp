const mongoose = require('mongoose');
const { ACTIVITY_TYPES } = require('../config/constants');

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    title: { type: String, required: true },
    description: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    scheduledAt: Date,
    completedAt: Date,
    isCompleted: { type: Boolean, default: false },
    outcome: String,
    followUpDate: Date,
    followUpNotes: String,
    duration: { type: Number },
    location: String,
    attachments: [{ name: String, url: String }],
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ client: 1 });
activitySchema.index({ scheduledAt: 1 });
activitySchema.index({ followUpDate: 1, isCompleted: 1 });

module.exports = mongoose.model('Activity', activitySchema);
