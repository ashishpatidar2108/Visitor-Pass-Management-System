const mongoose = require('mongoose');
const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    company: String,
    purpose: String,
    idProof: String,
    photo: String,
    organization: {
      type: String,
      required: true,
      default: 'Main Office',
      trim: true,
      index: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);
module.exports = mongoose.model('Visitor', visitorSchema);
