const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: Number, default: 0 },
  orderNo: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
