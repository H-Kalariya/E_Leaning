const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscriptionPlan: { type: String, enum: ["Free", "Premium"], default: "Free" },
  interests: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
