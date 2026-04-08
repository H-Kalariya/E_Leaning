const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String },
  level: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPremium: { type: Boolean, default: false },
  status: { type: String, enum: ['Draft', 'PendingApproval', 'Published', 'Rejected'], default: 'Draft' },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
