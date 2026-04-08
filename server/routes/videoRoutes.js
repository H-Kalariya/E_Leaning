const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadVideo, getCourseVideos, addYoutubeVideo } = require('../controllers/videoController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/videos';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\\s+/g, '_')}`);
  }
});
const upload = multer({ storage });

router.get('/:courseId', getCourseVideos);
router.post('/upload', protect, restrictTo('Teacher', 'Admin'), upload.single('video'), uploadVideo);
router.post('/add-youtube', protect, restrictTo('Teacher', 'Admin'), addYoutubeVideo);

module.exports = router;
