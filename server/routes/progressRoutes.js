const express = require('express');
const router = express.Router();
const { markComplete, getProgress } = require('../controllers/progressController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.post('/mark', protect, markComplete);
router.get('/:courseId', protect, getProgress);

module.exports = router;
