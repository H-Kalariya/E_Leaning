const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expertise: [{ type: String }],
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
