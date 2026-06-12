const mongoose = require('mongoose');
const checkLogSchema = new mongoose.Schema(
  {
    pass: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor' },
    organization: {
      type: String,
      required: true,
      default: 'Main Office',
      trim: true,
      index: true
    },
    action: { type: String, enum: ['checkin', 'checkout'], required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    location: { type: String, default: 'Main Gate' }
  },
  { timestamps: true }
);
module.exports = mongoose.model('CheckLog', checkLogSchema);
