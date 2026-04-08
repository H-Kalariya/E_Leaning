const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
}, { timestamps: true });

// Ensure unique progress tracking per course per student
progressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
