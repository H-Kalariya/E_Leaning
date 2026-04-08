const Progress = require('../models/Progress');
const Video = require('../models/Video');

const markComplete = async (req, res) => {
  const { videoId, courseId } = req.body;
  try {
    let progress = await Progress.findOne({ studentId: req.user._id, courseId });
    if (!progress) {
      progress = await Progress.create({
        studentId: req.user._id,
        courseId,
        completedVideos: [videoId]
      });
    } else {
      if (!progress.completedVideos.includes(videoId)) {
        progress.completedVideos.push(videoId);
        await progress.save();
      }
    }
    
    // Check total completion status
    const totalVideos = await Video.countDocuments({ courseId });
    const completedCount = progress.completedVideos.length;
    const isCompleted = completedCount >= totalVideos && totalVideos > 0;
    
    res.json({ message: 'Marked complete', progress, isCompleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProgress = async (req, res) => {
  try {
    // Both Teachers and Students might check.
    const studentId = req.user._id; 
    const courseId = req.params.courseId;
    
    const progress = await Progress.findOne({ studentId, courseId });
    const totalVideos = await Video.countDocuments({ courseId });
    const completedCount = progress ? progress.completedVideos.length : 0;
    const isCompleted = completedCount >= totalVideos && totalVideos > 0;

    res.json({ progress: progress ? progress.completedVideos : [], isCompleted, totalVideos, completedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { markComplete, getProgress };
