const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(express.json());
app.use(cors());

// Serve uploads folder statically for videos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const videoRoutes = require('./routes/videoRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const noteRoutes = require('./routes/noteRoutes');
const progressRoutes = require('./routes/progressRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/progress', progressRoutes);

// MongoDB Connection via Memory Server if URI is absent
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  let MONGO_URI = process.env.MONGO_URI;
  let isMemoryDB = false;
  
  if (!MONGO_URI) {
    console.log('No MONGO_URI provided. Starting in-memory MongoDB server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create({ 
      instance: { storageEngine: 'ephemeralForTest' } 
    });
    MONGO_URI = mongoServer.getUri();
    isMemoryDB = true;
  }

  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log(`MongoDB Connected successfully to: ${MONGO_URI}`);
      
      if (isMemoryDB) {
        const bcrypt = require('bcrypt');
        const User = require('./models/User');
        const Course = require('./models/Course');
        const Video = require('./models/Video');
        
        const count = await User.countDocuments();
        if (count === 0) {
            const hash = await bcrypt.hash('password', 10);
            
            // Hardcoded ObjectIds so existing tokens and URLs don't break on server auto-restarts
            const adminId = new mongoose.Types.ObjectId("64b8f0f0c000000000000001");
            const teacherId = new mongoose.Types.ObjectId("64b8f0f0c000000000000002");
            const studentId = new mongoose.Types.ObjectId("64b8f0f0c000000000000003");
            const course1Id = new mongoose.Types.ObjectId("64b8f0f0c000000000000101");
            const course2Id = new mongoose.Types.ObjectId("64b8f0f0c000000000000102");
            const course3Id = new mongoose.Types.ObjectId("64b8f0f0c000000000000103");
            const vid1Id = new mongoose.Types.ObjectId("64b8f0f0c000000000000201");
            const vidPyId = new mongoose.Types.ObjectId("64b8f0f0c000000000000204");

            const admin = await User.create({ _id: adminId, name: 'Admin', email: 'admin@demo.com', password: hash, role: 'Admin' });
            const teacher = await User.create({ _id: teacherId, name: 'Professor Smith', email: 'teacher@demo.com', password: hash, role: 'Teacher' });
            const student = await User.create({ _id: studentId, name: 'Demo Student', email: 'student@demo.com', password: hash, role: 'Student' });
            
            const course1 = await Course.create({ 
               _id: course1Id,
               title: 'React & AI Fundamentals', 
               description: 'A comprehensive guide to leveraging AI inside modern React applications. Covers hooks, state, and LLM integrations.', 
               teacherId: teacher._id, 
               status: 'Published' 
            });
            const course2 = await Course.create({ 
               _id: course2Id,
               title: 'Python for Data Science', 
               description: 'Learn Python from scratch with real-world data science projects. Covers NumPy, Pandas, Matplotlib and ML basics.', 
               teacherId: teacher._id, 
               status: 'Published' 
            });
            const course3 = await Course.create({ 
               _id: course3Id,
               title: 'Full Stack Web Development', 
               description: 'Build complete MERN stack applications from design to deployment. Includes MongoDB, Express, React, and Node.js.', 
               teacherId: teacher._id, 
               status: 'Published',
               isPremium: true
            });

            // React course videos
            const vid1 = await Video.create({ _id: vid1Id, courseId: course1._id, title: 'React JS in 100 Seconds', url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', orderNo: 1 });
            await Video.create({ courseId: course1._id, title: 'AI & Machine Learning Explained', url: 'https://www.youtube.com/watch?v=HcqpanDadyQ', orderNo: 2 });
            await Video.create({ courseId: course1._id, title: 'React Hooks Explained', url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q', orderNo: 3 });

            // Python course videos
            const vidPy = await Video.create({ _id: vidPyId, courseId: course2._id, title: 'Python in 100 Seconds', url: 'https://www.youtube.com/watch?v=x7X9w_GIm1s', orderNo: 1 });
            await Video.create({ courseId: course2._id, title: 'NumPy Crash Course', url: 'https://www.youtube.com/watch?v=8Y0qQEh7dJg', orderNo: 2 });

            // Full Stack course videos
            await Video.create({ courseId: course3._id, title: 'MERN Stack Tutorial', url: 'https://www.youtube.com/watch?v=7CqJlxBYj-M', orderNo: 1 });
            await Video.create({ courseId: course3._id, title: 'MongoDB Crash Course', url: 'https://www.youtube.com/watch?v=ofme2o29ngU', orderNo: 2 });

            const Note = require('./models/Note');
            
            await Note.create({
              videoId: vid1._id,
              courseId: course1._id,
              content: `# React in 100 Seconds\n\nReact is a UI library to build declarative component-based interfaces.\n\n### Key Concepts:\n- **Components:** Modular pieces of UI.\n- **State:** Data that changes over time.\n- **JSX:** XML-like syntax inside JS.\n\n> "React makes building UIs painless."`
            });
            
            await Note.create({
              videoId: vidPy._id,
              courseId: course2._id,
              content: `# Python Overivew\n\nPython is a high-level, interpreted programming language known for readability.\n\n### Examples:\n\`\`\`python\nprint("Hello World")\n\`\`\``
            });

            console.log('--- DB Seeded Successfully ---');
            console.log('  👤 admin@demo.com    | password (Admin)');
            console.log('  👤 teacher@demo.com  | password (Teacher)');
            console.log('  👤 student@demo.com  | password (Student)');
            console.log('  📚 3 courses seeded with videos & sample notes');
        }
      }

      app.listen(PORT, () => {
        console.log(`Node server running on port ${PORT}`);
      });
    })
    .catch((err) => console.log('Database connection error: ', err));
};

startServer();
