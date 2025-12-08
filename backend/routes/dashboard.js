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

    const { selectedClass } = req.query;

    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();

    // Topic-wise Average Marks for Selected Class (or all if not selected)
    let matchStage = {};
    if (selectedClass && selectedClass !== 'all') {
      matchStage = { class: selectedClass };
    }

    // We need to aggregate scores from Assignments or Quizzes based on students in the selected class
    // 1. Find students in the class
    const studentsInClass = await Student.find(matchStage).select('_id');
    const studentIds = studentsInClass.map(s => s._id);

    // 2. Aggregate Quiz scores for these students by topic
    const topicPerformance = await Quiz.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: "$topic", avgScore: { $avg: "$score" } } },
      { $project: { topic: "$_id", avgScore: { $round: ["$avgScore", 1] }, _id: 0 } }
    ]);

    // Get list of available classes for the dropdown
    const classes = await Student.distinct('class');

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
      topicPerformance,
      availableClasses: classes,
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

    const QuizResult = require('../models/QuizResult');
    
    let student = await Student.findOne({ userId: req.user.userId });
    if (!student) {
      // Create a basic student record if it doesn't exist
      student = new Student({ 
        userId: req.user.userId,
        performanceMetrics: {
          totalQuizzesTaken: 0,
          averageScore: 0,
          streakData: { currentStreak: 0, longestStreak: 0 }
        },
        achievements: []
      });
      await student.save();
    }
    
    const assignments = await Assignment.find({ studentId: student._id });
    
    // Get quiz results for comprehensive analytics
    const quizResults = await QuizResult.find({ userId: req.user.userId })
      .sort({ completedAt: -1 })
      .limit(50); // Last 50 quizzes for analysis

    const performanceData = {
      topics: [],
      averageScore: 0,
      recentPerformance: [],
      topicProgress: {},
      streakData: student?.performanceMetrics?.streakData || { currentStreak: 0, longestStreak: 0 },
      achievements: student?.achievements || []
    };

    // Combine assignment and quiz data
    const allScores = [];
    const topicScores = {};

    // Process assignments
    if (assignments.length > 0) {
      assignments.forEach(a => {
        if (a.score !== undefined) {
          allScores.push(a.score);
          if (!topicScores[a.topic]) {
            topicScores[a.topic] = { scores: [], count: 0, type: 'assignment' };
          }
          topicScores[a.topic].scores.push(a.score);
        }
      });
    }

    // Process quiz results
    if (quizResults.length > 0) {
      quizResults.forEach(qr => {
        allScores.push(qr.score);
        if (!topicScores[qr.topic]) {
          topicScores[qr.topic] = { scores: [], count: 0, type: 'quiz' };
        }
        topicScores[qr.topic].scores.push(qr.score);
        topicScores[qr.topic].count++;
      });

      // Recent performance trend (last 10 quizzes)
      performanceData.recentPerformance = quizResults.slice(0, 10).map(qr => ({
        score: qr.score,
        topic: qr.topic,
        date: qr.completedAt,
        quizTitle: qr.quizTitle,
        timeTaken: qr.timeTaken
      })).reverse(); // Reverse to show chronological order
    }

    // Calculate topic-wise performance
    performanceData.topics = Object.entries(topicScores).map(([topic, data]) => {
      const avgScore = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
      const improvement = data.scores.length > 1 ? 
        Math.round(((data.scores[data.scores.length - 1] - data.scores[0]) / data.scores[0]) * 100) : 0;
      
      return {
        topic,
        avgScore,
        totalAttempts: data.scores.length,
        bestScore: Math.max(...data.scores),
        worstScore: Math.min(...data.scores),
        improvement: improvement,
        status: avgScore >= 80 ? 'Excellent' : avgScore >= 70 ? 'Good' : avgScore >= 60 ? 'Fair' : 'Needs Improvement',
        lastAttempt: data.scores[data.scores.length - 1],
        trend: data.scores.length > 1 ? (data.scores[data.scores.length - 1] > data.scores[data.scores.length - 2] ? 'up' : 'down') : 'stable'
      };
    });

    // Calculate overall average score
    if (allScores.length > 0) {
      performanceData.averageScore = Math.round(
        allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      );
    }

    // Topic progress analysis
    performanceData.topicProgress = performanceData.topics.reduce((acc, topic) => {
      acc[topic.topic] = {
        mastery: topic.avgScore >= 80 ? 'mastered' : topic.avgScore >= 70 ? 'proficient' : 'learning',
        scoreHistory: topicScores[topic.topic].scores,
        recommendation: topic.avgScore < 70 ? 
          `Focus more on ${topic.topic} - consider reviewing basic concepts` :
          `Great progress in ${topic.topic} - try advanced challenges`
      };
      return acc;
    }, {});

    // Calculate additional metrics
    const additionalMetrics = {
      totalQuizzesTaken: quizResults.length,
      totalAssignments: assignments.length,
      bestOverallScore: allScores.length > 0 ? Math.max(...allScores) : 0,
      worstOverallScore: allScores.length > 0 ? Math.min(...allScores) : 0,
      consistencyScore: calculateConsistency(allScores),
      weeklyActivity: getWeeklyActivity(quizResults),
      strongestTopics: performanceData.topics
        .filter(t => t.avgScore >= 80)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 3)
        .map(t => t.topic),
      improvementNeeded: performanceData.topics
        .filter(t => t.avgScore < 70)
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 3)
        .map(t => t.topic)
    };

    res.json({
      student: student,
      performanceData,
      additionalMetrics,
      totalAssignments: assignments.length,
      totalQuizzes: quizResults.length
    });
  } catch (error) {
    console.error('Error in student stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Helper function to calculate consistency score
function calculateConsistency(scores) {
  if (scores.length < 2) return 100;
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to consistency score (lower deviation = higher consistency)
  return Math.max(0, Math.round(100 - (standardDeviation * 2)));
}

// Helper function to get weekly activity
function getWeeklyActivity(quizResults) {
  const weeklyData = {};
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    weeklyData[dateStr] = 0;
  }
  
  quizResults.forEach(result => {
    const dateStr = result.completedAt.toISOString().split('T')[0];
    if (weeklyData.hasOwnProperty(dateStr)) {
      weeklyData[dateStr]++;
    }
  });
  
  return Object.entries(weeklyData).map(([date, count]) => ({
    date,
    count,
    day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
  }));
}

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

    // Fetch students assigned to this teacher
    const students = await Student.find({ _id: { $in: teacher.assignedStudents } })
      .populate('userId', 'name email')
      .select('performanceMetrics userId totalScore grade class topics'); // Added 'topics' to show struggling tags

    // For each student, fetch their recent quiz scores for the sparkline
    const studentsWithSparkline = await Promise.all(students.map(async (student) => {
      const recentQuizzes = await Quiz.find({ studentId: student._id })
        .sort({ completedAt: 1 }) // Sort by date ascending for graph
        .limit(10) // Last 10 quizzes
        .select('score topic');

      return {
        ...student.toObject(),
        sparklineData: recentQuizzes.map(q => q.score || 0),
        recentTopics: recentQuizzes.map(q => q.topic)
      };
    }));

    res.json(studentsWithSparkline);
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

// AI Helper - Connected to STEM Learning Enhancer
router.post('/student/ai-helper', auth, async (req, res) => {
  try {
    const { query, mother_tongue } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Get user information
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare request to STEM API
    const stemApiUrl = 'http://localhost:5002/api/stem/ask';
    const requestData = {
      query: query.trim(),
      user_id: req.user.userId,
      mother_tongue: mother_tongue || 'english'
    };

    console.log('Forwarding to STEM API:', requestData);

    // Make request to STEM API
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(stemApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        timeout: 30000 // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`STEM API error: ${response.status} - ${errorData.message || errorData.error}`);
      }

      const stemResponse = await response.json();
      
      // Return the enhanced response
      res.json({
        answer: stemResponse.answer,
        metadata: stemResponse.metadata || {},
        success: true,
        source: 'STEM Learning Enhancer'
      });

    } catch (fetchError) {
      console.error('STEM API connection error:', fetchError);
      
      // Fallback to basic response if STEM API is unavailable
      const fallbackResponse = `I understand you're asking about: "${query}". 

While our advanced AI system is currently unavailable, here are some suggestions:

1. 📚 This appears to be a STEM-related question
2. 🔍 Try breaking down the question into smaller parts
3. 🌍 Consider how this concept applies in your daily life
4. 📖 Look for examples around you

Our enhanced AI system with historical learning connections will be available once the service is running.

For immediate help, you can:
• Ask your teacher or classmates
• Search for educational videos online
• Use textbooks or educational websites

The question "${query}" is a great learning opportunity!`;

      res.json({
        answer: fallbackResponse,
        metadata: {
          fallback: true,
          original_query: query,
          user_language: mother_tongue || 'english'
        },
        success: true,
        source: 'Fallback System'
      });
    }

  } catch (error) {
    console.error('AI Helper error:', error);
    res.status(500).json({ 
      message: 'AI Helper failed', 
      error: error.message,
      success: false
    });
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
