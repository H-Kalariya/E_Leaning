const Video = require('../models/Video');
const Course = require('../models/Course');

const uploadVideo = async (req, res) => {
  const { courseId, title, orderNo } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No video file provided' });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload video to this course' });
    }

    const video = await Video.create({
      courseId,
      title,
      url: `/uploads/videos/${file.filename}`, // Using local multer storage
      duration: 0,
      orderNo: orderNo || 0
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseVideos = async (req, res) => {
  try {
    const videos = await Video.find({ courseId: req.params.courseId }).sort({ orderNo: 1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addYoutubeVideo = async (req, res) => {
  const { courseId, title, youtubeUrl, orderNo } = req.body;

  if (!youtubeUrl) return res.status(400).json({ message: 'No YouTube URL provided' });

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    if (course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const video = await Video.create({
      courseId,
      title,
      url: youtubeUrl,
      duration: 0,
      orderNo: orderNo || 0
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadVideo, getCourseVideos, addYoutubeVideo };
