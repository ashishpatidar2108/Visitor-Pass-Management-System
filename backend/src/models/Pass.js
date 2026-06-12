const mongoose = require('mongoose');
const passSchema = new mongoose.Schema(
  {
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visitor',
      required: true
    },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    organization: {
      type: String,
      required: true,
      default: 'Main Office',
      trim: true,
      index: true
    },
    qrToken: { type: String, required: true, unique: true },
    qrImage: String,
    pdfPath: String,
    validFrom: Date,
    validTo: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);
module.exports = mongoose.model('Pass', passSchema);
