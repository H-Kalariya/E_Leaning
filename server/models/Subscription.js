const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ["Free", "Premium"], default: "Premium" },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
