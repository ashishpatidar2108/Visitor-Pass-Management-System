const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'security', 'employee', 'visitor'],
      default: 'visitor'
    },
    organization: {
      type: String,
      required: true,
      default: 'Main Office',
      trim: true,
      index: true
    },
    phone: String,
    isVerified: { type: Boolean, default: false },
    verificationOtpHash: String,
    verificationOtpExpiresAt: Date,
    verificationOtpAttempts: { type: Number, default: 0 },
    verificationOtpLastSentAt: Date
  },
  { timestamps: true }
);
module.exports = mongoose.model('User', userSchema);
