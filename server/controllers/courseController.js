const Course = require('../models/Course');
const Video = require('../models/Video');

const createCourse = async (req, res) => {
  const { title, description, category, level, isPremium } = req.body;
  try {
    const course = await Course.create({
      title, description, category, level, isPremium,
      teacherId: req.user._id,
      status: 'Draft'
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'Published' }).populate('teacherId', 'name');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin sees all courses including pending
const getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.find({}).populate('teacherId', 'name email').sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Teacher submits for review → PendingApproval
const publishCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const videos = await Video.find({ courseId: course._id });
    if (videos.length === 0) {
      return res.status(400).json({ message: 'Cannot submit course without videos' });
    }

    // Admin can publish directly; Teachers submit for review
    course.status = req.user.role === 'Admin' ? 'Published' : 'PendingApproval';
    await course.save();
    res.json({ message: course.status === 'Published' ? 'Course published' : 'Course submitted for admin approval', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin approves a pending course
const approveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.status = 'Published';
    await course.save();
    res.json({ message: 'Course approved and published', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin rejects / sends back to teacher
const rejectCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.status = 'Rejected';
    course.rejectionReason = req.body.reason || 'Rejected by admin';
    await course.save();
    res.json({ message: 'Course rejected', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeacherCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacherId: req.user._id });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCourse, getAllCourses, getAllCoursesAdmin, publishCourse, approveCourse, rejectCourse, getTeacherCourses };
