const express = require('express');
const router = express.Router();
const { registerUser, loginUser, upgradeUser } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/upgrade', protect, upgradeUser);

module.exports = router;
