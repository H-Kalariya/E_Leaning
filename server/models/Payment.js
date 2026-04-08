const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
  method: { type: String, default: "Razorpay" },
  transactionRef: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
