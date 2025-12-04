const express = require('express');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
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
    
    // Get teacher activity heatmap data
    const teachers = await Teacher.find().populate('userId');
    const activityHeatmap = teachers.map(t => ({
      name: t.userId.name,
      activity: t.activityLevel,
      logins: t.loginHistory.length,
      avgDuration: t.loginHistory.length > 0 
        ? Math.round(t.loginHistory.reduce((sum, log) => sum + log.duration, 0) / t.loginHistory.length)
        : 0
    }));

    res.json({
      totalStudents,
      totalTeachers,
      activityHeatmap
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
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

// Submit assignment
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
