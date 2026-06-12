const mongoose = require('mongoose');
const appointmentSchema = new mongoose.Schema(
  {
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visitor',
      required: true
    },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organization: {
      type: String,
      required: true,
      default: 'Main Office',
      trim: true,
      index: true
    },
    date: { type: Date, required: true },
    purpose: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    notes: String
  },
  { timestamps: true }
);
module.exports = mongoose.model('Appointment', appointmentSchema);
