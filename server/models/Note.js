const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  content: { type: String, required: true },
  title: { type: String },
  isPublished: { type: Boolean, default: true },
  editedByTeacher: { type: Boolean, default: false },
  version: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
