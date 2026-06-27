const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:      { type: String, required: true },
  amount:    { type: Number, required: true, min: 0 },
  category:  { type: String, required: true, default: 'Other' },
  type:      { type: String, enum: ['expense', 'income'], required: true },
  date:      { type: String, required: true },
  recurring: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Entry', entrySchema);
