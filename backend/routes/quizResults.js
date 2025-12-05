const express = require('express');
const router = express.Router();
const QuizResult = require('../models/QuizResult');
const Student = require('../models/Student');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Submit quiz results
router.post('/submit', auth, async (req, res) => {
  try {
    const { 
      quizTitle, 
      topic, 
      questions, 
      totalQuestions, 
      correctAnswers, 
      score, 
      rawScore, 
      maxScore, 
      timeTaken,
      difficulty = 'medium',
      category = 'general'
    } = req.body;

    const userId = req.user.userId;

    // Find or create student record
    let student = await Student.findOne({ userId });
    if (!student) {
      student = new Student({ 
        userId,
        performanceMetrics: {
          strengths: [],
          weaknesses: [],
          averageScore: 0,
          totalQuizzesTaken: 0,
          bestScore: 0,
          worstScore: 100,
          recentScores: [],
          topicPerformance: [],
          streakData: {
            currentStreak: 0,
            longestStreak: 0
          },
          learningPath: {
            completedTopics: [],
            recommendedTopics: [],
            difficultyLevel: 'beginner'
          }
        },
        achievements: []
      });
    }

    // Check if this is a retake
    const previousAttempts = await QuizResult.countDocuments({ 
      userId, 
      quizTitle, 
      topic 
    });

    // Create quiz result
    const quizResult = new QuizResult({
      studentId: student._id,
      userId,
      quizTitle,
      topic,
      questions,
      totalQuestions,
      correctAnswers,
      score,
      rawScore,
      maxScore,
      timeTaken,
      attemptNumber: previousAttempts + 1,
      isRetake: previousAttempts > 0,
      difficulty,
      category,
      feedback: generateFeedback(questions, score, topic)
    });

    await quizResult.save();

    // Update student performance metrics
    await updateStudentPerformance(student, quizResult);

    // Check for achievements
    await checkAchievements(student, quizResult);

    res.json({
      message: 'Quiz submitted successfully',
      result: quizResult,
      performance: student.performanceMetrics
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's quiz history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, topic, sortBy = 'completedAt' } = req.query;

    const query = { userId };
    if (topic) query.topic = topic;

    const results = await QuizResult.find(query)
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('studentId', 'grade class');

    const total = await QuizResult.countDocuments(query);

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get performance analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { timeframe = '30' } = req.query; // days

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(timeframe));

    // Get recent quiz results
    const recentResults = await QuizResult.find({
      userId,
      completedAt: { $gte: dateLimit }
    }).sort({ completedAt: -1 });

    // Calculate analytics
    const analytics = {
      totalQuizzes: recentResults.length,
      averageScore: recentResults.length > 0 ? 
        recentResults.reduce((sum, r) => sum + r.score, 0) / recentResults.length : 0,
      bestScore: recentResults.length > 0 ? 
        Math.max(...recentResults.map(r => r.score)) : 0,
      worstScore: recentResults.length > 0 ? 
        Math.min(...recentResults.map(r => r.score)) : 0,
      topicBreakdown: {},
      performanceTrend: [],
      recentActivity: recentResults.slice(0, 5)
    };

    // Topic-wise performance
    recentResults.forEach(result => {
      if (!analytics.topicBreakdown[result.topic]) {
        analytics.topicBreakdown[result.topic] = {
          count: 0,
          totalScore: 0,
          averageScore: 0
        };
      }
      analytics.topicBreakdown[result.topic].count++;
      analytics.topicBreakdown[result.topic].totalScore += result.score;
      analytics.topicBreakdown[result.topic].averageScore = 
        analytics.topicBreakdown[result.topic].totalScore / 
        analytics.topicBreakdown[result.topic].count;
    });

    // Performance trend (last 10 quizzes)
    analytics.performanceTrend = recentResults
      .slice(0, 10)
      .reverse()
      .map(result => ({
        score: result.score,
        topic: result.topic,
        date: result.completedAt,
        quizTitle: result.quizTitle
      }));

    res.json(analytics);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { topic, timeframe = '7' } = req.query; // days

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(timeframe));

    const matchStage = {
      completedAt: { $gte: dateLimit }
    };
    if (topic) matchStage.topic = topic;

    const leaderboard = await QuizResult.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          averageScore: { $avg: '$score' },
          totalQuizzes: { $sum: 1 },
          bestScore: { $max: '$score' }
        }
      },
      { $sort: { averageScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          averageScore: { $round: ['$averageScore', 1] },
          totalQuizzes: 1,
          bestScore: 1
        }
      }
    ]);

    res.json(leaderboard);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to generate feedback
function generateFeedback(questions, score, topic) {
  const feedback = {
    strengths: [],
    weaknesses: [],
    recommendations: []
  };

  const correctCount = questions.filter(q => q.isCorrect).length;
  const incorrectQuestions = questions.filter(q => !q.isCorrect);

  // Analyze performance
  if (score >= 80) {
    feedback.strengths.push(`Excellent performance in ${topic}`);
    feedback.recommendations.push(`Try advanced level questions in ${topic}`);
  } else if (score >= 60) {
    feedback.strengths.push(`Good understanding of ${topic} basics`);
    feedback.recommendations.push(`Review challenging concepts and practice more`);
  } else {
    feedback.weaknesses.push(`Needs improvement in ${topic} fundamentals`);
    feedback.recommendations.push(`Focus on basic concepts and take practice quizzes`);
  }

  // Analyze incorrect answers for patterns
  if (incorrectQuestions.length > 0) {
    const commonErrors = incorrectQuestions.slice(0, 2).map(q => q.question);
    feedback.weaknesses.push(`Difficulty with: ${commonErrors.join(', ')}`);
  }

  return feedback;
}

// Helper function to update student performance
async function updateStudentPerformance(student, quizResult) {
  const metrics = student.performanceMetrics;

  // Update basic metrics
  metrics.totalQuizzesTaken = (metrics.totalQuizzesTaken || 0) + 1;
  metrics.bestScore = Math.max(metrics.bestScore || 0, quizResult.score);
  metrics.worstScore = Math.min(metrics.worstScore || 100, quizResult.score);

  // Update recent scores (keep last 10)
  metrics.recentScores = metrics.recentScores || [];
  metrics.recentScores.unshift({
    score: quizResult.score,
    topic: quizResult.topic,
    date: quizResult.completedAt,
    quizTitle: quizResult.quizTitle
  });
  if (metrics.recentScores.length > 10) {
    metrics.recentScores = metrics.recentScores.slice(0, 10);
  }

  // Calculate average score
  metrics.averageScore = metrics.recentScores.reduce((sum, s) => sum + s.score, 0) / metrics.recentScores.length;

  // Update topic performance
  metrics.topicPerformance = metrics.topicPerformance || [];
  let topicPerf = metrics.topicPerformance.find(tp => tp.topic === quizResult.topic);
  
  if (!topicPerf) {
    topicPerf = {
      topic: quizResult.topic,
      averageScore: quizResult.score,
      quizzesTaken: 1,
      bestScore: quizResult.score,
      lastAttempt: quizResult.completedAt,
      improvement: 0
    };
    metrics.topicPerformance.push(topicPerf);
  } else {
    const oldAverage = topicPerf.averageScore;
    topicPerf.quizzesTaken++;
    topicPerf.averageScore = ((topicPerf.averageScore * (topicPerf.quizzesTaken - 1)) + quizResult.score) / topicPerf.quizzesTaken;
    topicPerf.bestScore = Math.max(topicPerf.bestScore, quizResult.score);
    topicPerf.improvement = topicPerf.averageScore - oldAverage;
    topicPerf.lastAttempt = quizResult.completedAt;
  }

  // Update streak
  const today = new Date().toDateString();
  const lastQuizDate = metrics.streakData?.lastQuizDate?.toDateString();
  
  if (lastQuizDate === today) {
    // Same day, don't update streak
  } else if (lastQuizDate === new Date(Date.now() - 86400000).toDateString()) {
    // Yesterday, continue streak
    metrics.streakData.currentStreak++;
  } else {
    // Reset streak
    metrics.streakData.currentStreak = 1;
  }
  
  metrics.streakData.longestStreak = Math.max(
    metrics.streakData.longestStreak, 
    metrics.streakData.currentStreak
  );
  metrics.streakData.lastQuizDate = new Date();

  await student.save();
}

// Helper function to check achievements
async function checkAchievements(student, quizResult) {
  const achievements = [];
  const existingAchievements = student.achievements.map(a => a.title);

  // First quiz achievement
  if (student.performanceMetrics.totalQuizzesTaken === 1 && !existingAchievements.includes('First Steps')) {
    achievements.push({
      title: 'First Steps',
      description: 'Completed your first quiz!',
      icon: '🎯',
      category: 'milestone'
    });
  }

  // Perfect score achievement
  if (quizResult.score === 100 && !existingAchievements.includes('Perfect Score')) {
    achievements.push({
      title: 'Perfect Score',
      description: 'Achieved 100% on a quiz!',
      icon: '⭐',
      category: 'performance'
    });
  }

  // Streak achievements
  const currentStreak = student.performanceMetrics.streakData.currentStreak;
  if (currentStreak === 7 && !existingAchievements.includes('Week Warrior')) {
    achievements.push({
      title: 'Week Warrior',
      description: 'Completed quizzes for 7 days straight!',
      icon: '🔥',
      category: 'streak'
    });
  }

  // Quiz count achievements
  const totalQuizzes = student.performanceMetrics.totalQuizzesTaken;
  if (totalQuizzes === 10 && !existingAchievements.includes('Quiz Explorer')) {
    achievements.push({
      title: 'Quiz Explorer',
      description: 'Completed 10 quizzes!',
      icon: '🎓',
      category: 'milestone'
    });
  }

  // Add achievements to student
  student.achievements.push(...achievements);
  if (achievements.length > 0) {
    await student.save();
  }
}

module.exports = router;
