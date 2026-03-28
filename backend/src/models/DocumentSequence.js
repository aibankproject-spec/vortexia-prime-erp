const mongoose = require('mongoose');

const documentSequenceSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  prefix: { type: String, required: true },
  currentNumber: { type: Number, default: 0 },
  year: { type: Number, required: true },
  padding: { type: Number, default: 5 },
});

documentSequenceSchema.statics.getNextNumber = async function (type, prefix) {
  const year = new Date().getFullYear();
  const doc = await this.findOneAndUpdate(
    { type, year },
    { $inc: { currentNumber: 1 }, $setOnInsert: { prefix, padding: 5 } },
    { upsert: true, new: true }
  );
  const paddedNum = String(doc.currentNumber).padStart(doc.padding, '0');
  return `${doc.prefix}-${year}-${paddedNum}`;
};

module.exports = mongoose.model('DocumentSequence', documentSequenceSchema);
