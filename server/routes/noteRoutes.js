const express = require('express');
const router = express.Router();
const { generateNotes, saveNotes, getNotes, checkPremium } = require('../controllers/noteController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.post('/generate', protect, restrictTo('Teacher', 'Admin'), generateNotes);
router.post('/save', protect, restrictTo('Teacher', 'Admin'), saveNotes);
router.get('/:videoId', protect, getNotes); // Students can view, protected evaluates role
router.get('/download/:videoId', protect, restrictTo('Student', 'Admin'), checkPremium, (req, res) => {
   res.json({ message: "Download logic placeholder (Verified Premium)" });
});

module.exports = router;
