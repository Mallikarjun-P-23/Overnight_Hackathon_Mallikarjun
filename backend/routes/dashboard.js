const express = require('express');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

const Announcement = require('../models/Announcement');
const Quiz = require('../models/Quiz');
const QuizTemplate = require('../models/QuizTemplate');
const Reminder = require('../models/Reminder');
const auth = require('../middleware/auth');

const router = express.Router();

// Get Principal Dashboard Stats
router.get('/principal/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'principal') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();

    // Class-wise Average Marks (Mock logic as Class model might not exist or needs aggregation)
    // Assuming Student model has 'class' field
    const classPerformance = await Student.aggregate([
      { $group: { _id: "$class", avgScore: { $avg: "$totalScore" }, studentCount: { $sum: 1 } } }
    ]);

    // Enrollment Trends (Mock logic - grouping by enrolledAt)
    const enrollmentTrends = await Student.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Grade/Class Distribution
    const gradeDistribution = await Student.aggregate([
      { $group: { _id: "$grade", count: { $sum: 1 } } }
    ]);

    // Get teacher activity heatmap data
    const teachers = await Teacher.find().populate('userId');
    const activityHeatmap = teachers.map(t => ({
      name: t.userId.name,
      activity: t.activityLevel,
      lastActive: t.lastActive,
      logins: t.loginHistory.length,
      avgDuration: t.loginHistory.length > 0
        ? Math.round(t.loginHistory.reduce((sum, log) => sum + log.duration, 0) / t.loginHistory.length)
        : 0
    }));

    // Fetch recent announcements
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(5).populate('sender', 'name');

    res.json({
      totalStudents,
      totalTeachers,
      classPerformance,
      enrollmentTrends,
      gradeDistribution,
      activityHeatmap,
      announcements
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Post Announcement (Principal only)
router.post('/principal/announcement', auth, async (req, res) => {
  try {
    if (req.user.role !== 'principal') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { title, content, targetAudience, targetClass } = req.body;
    const announcement = new Announcement({
      title,
      content,
      sender: req.user.userId,
      targetAudience,
      targetClass
    });
    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to post announcement', error: error.message });
  }
});

// Get Teacher Dashboard Stats
router.get('/teacher/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const teacher = await Teacher.findOne({ userId: req.user.userId }).populate('assignedStudents');
    const assignments = await Assignment.find({ teacherId: teacher._id }).populate('studentId');

    const strugglingTopics = {};
    assignments.forEach(a => {
      if (a.score && a.score < 70) {
        if (!strugglingTopics[a.topic]) {
          strugglingTopics[a.topic] = [];
        }
        strugglingTopics[a.topic].push({
          studentName: a.studentId.userId?.name || 'Unknown',
          score: a.score
        });
      }
    });

    res.json({
      assignedStudentsCount: teacher.assignedStudents.length,
      assignedStudents: teacher.assignedStudents,
      strugglingTopics,
      totalAssignments: assignments.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Get Student Dashboard Stats
router.get('/student/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const student = await Student.findOne({ userId: req.user.userId });
    const assignments = await Assignment.find({ studentId: student._id });

    const performanceData = {
      topics: [],
      averageScore: 0
    };

    if (assignments.length > 0) {
      const topicScores = {};
      assignments.forEach(a => {
        if (!topicScores[a.topic]) {
          topicScores[a.topic] = { scores: [], count: 0 };
        }
        topicScores[a.topic].scores.push(a.score || 0);
      });

      performanceData.topics = Object.entries(topicScores).map(([topic, data]) => ({
        topic,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        status: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) >= 70 ? 'Good' : 'Needs Improvement'
      }));

      performanceData.averageScore = Math.round(
        assignments.reduce((sum, a) => sum + (a.score || 0), 0) / assignments.length
      );
    }

    res.json({
      student: student,
      performanceData,
      totalAssignments: assignments.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Get all students (for Teacher)
router.get('/students', auth, async (req, res) => {
  try {
    const students = await Student.find().populate('userId');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
});



// Create Quiz (Teacher)
router.post('/teacher/quiz', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { title, targetClass, topic, difficulty, questions, scheduledAt, durationMinutes } = req.body;

    // Find teacher document to get _id
    const teacher = await Teacher.findOne({ userId: req.user.userId });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

    const quizTemplate = new QuizTemplate({
      title,
      teacherId: teacher._id,
      targetClass,
      topic,
      difficulty,
      questions,
      scheduledAt,
      durationMinutes
    });
    await quizTemplate.save();
    res.status(201).json(quizTemplate);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create quiz', error: error.message });
  }
});

// Get Reminders (Teacher)
router.get('/teacher/reminders', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reminders', error: error.message });
  }
});

// Create Reminder (Teacher)
router.post('/teacher/reminder', auth, async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const reminder = new Reminder({
      userId: req.user.userId,
      title,
      description,
      dueDate
    });
    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create reminder', error: error.message });
  }
});

// Get Student Performance Reports (Teacher)
router.get('/teacher/reports', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const teacher = await Teacher.findOne({ userId: req.user.userId });

    // Aggregate quiz results for students assigned to this teacher
    // This is a simplified aggregation
    const reports = await Quiz.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $match: { 'student._id': { $in: teacher.assignedStudents } } },
      {
        $group: {
          _id: '$student._id',
          studentName: { $first: '$student.userId' }, // Need to populate user name, this is tricky in aggregate without another lookup
          avgScore: { $avg: '$score' },
          totalQuizzes: { $sum: 1 }
        }
      }
    ]);

    // Better to just fetch students and their performance metrics
    const students = await Student.find({ _id: { $in: teacher.assignedStudents } })
      .populate('userId', 'name email')
      .select('performanceMetrics userId totalScore');

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
});

// Get Specific Student Analytics (Teacher)
router.get('/teacher/student/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const quizzes = await Quiz.find({ studentId: student._id }).populate('quizTemplateId');

    res.json({
      student,
      quizzes
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student analytics', error: error.message });
  }
});

// Get Student Quizzes (Student)
router.get('/student/quizzes', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const student = await Student.findOne({ userId: req.user.userId });
    // Find quizzes assigned to student's class
    // This assumes QuizTemplate has 'targetClass' which matches student's class
    const quizzes = await QuizTemplate.find({ targetClass: student.class, scheduledAt: { $gt: new Date() } });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error: error.message });
  }
});

// AI Helper (Mock)
router.post('/student/ai-helper', auth, async (req, res) => {
  try {
    const { query } = req.body;
    // Mock response
    res.json({ answer: `Here is a helpful answer to your question: "${query}". (AI integration pending)` });
  } catch (error) {
    res.status(500).json({ message: 'AI Helper failed', error: error.message });
  }
});

// Video Converter (Mock)
router.post('/student/video-convert', auth, async (req, res) => {
  try {
    // Mock conversion
    res.json({ message: 'Video conversion started', downloadUrl: 'http://example.com/converted.mp4' });
  } catch (error) {
    res.status(500).json({ message: 'Video conversion failed', error: error.message });
  }
});

// Submit assignment (Existing)
router.post('/submit-assignment', auth, async (req, res) => {
  try {
    const { assignmentId, score, feedback } = req.body;
    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { score, feedback, submittedAt: new Date() },
      { new: true }
    );
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit assignment', error: error.message });
  }
});

module.exports = router;
