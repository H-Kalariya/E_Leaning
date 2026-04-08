const express = require('express');
const router = express.Router();
const { activateSubscription, processPayment } = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.post('/activate', protect, restrictTo('Student', 'Admin'), activateSubscription);
router.post('/process', protect, restrictTo('Student', 'Admin'), processPayment);

module.exports = router;
