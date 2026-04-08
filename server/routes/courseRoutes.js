const express = require('express');
const router = express.Router();
const { createCourse, getAllCourses, getAllCoursesAdmin, publishCourse, approveCourse, rejectCourse, getTeacherCourses } = require('../controllers/courseController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.get('/all', getAllCourses);
router.get('/admin/all', protect, restrictTo('Admin'), getAllCoursesAdmin);
router.get('/teacher', protect, restrictTo('Teacher', 'Admin'), getTeacherCourses);
router.post('/create', protect, restrictTo('Teacher', 'Admin'), createCourse);
router.post('/publish/:id', protect, restrictTo('Teacher', 'Admin'), publishCourse);
router.post('/approve/:id', protect, restrictTo('Admin'), approveCourse);
router.post('/reject/:id', protect, restrictTo('Admin'), rejectCourse);

module.exports = router;
