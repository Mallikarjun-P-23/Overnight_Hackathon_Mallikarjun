const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String },
  class: { type: String },
  enrolledAt: { type: Date, default: Date.now },
  totalScore: { type: Number, default: 0 },
  topics: [String],
  performanceMetrics: {
    strengths: [String],
    weaknesses: [String],
    averageScore: { type: Number, default: 0 },
    totalQuizzesTaken: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    worstScore: { type: Number, default: 100 },
    recentScores: [{ 
      score: Number, 
      topic: String, 
      date: { type: Date, default: Date.now },
      quizTitle: String
    }],
    topicPerformance: [{
      topic: String,
      averageScore: Number,
      quizzesTaken: Number,
      bestScore: Number,
      lastAttempt: Date,
      improvement: Number // Percentage improvement from first to last
    }],
    streakData: {
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastQuizDate: Date
    },
    learningPath: {
      completedTopics: [String],
      currentTopic: String,
      recommendedTopics: [String],
      difficultyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' }
    }
  },
  weeklySessions: [{ date: Date, duration: Number }],
  achievements: [{
    title: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    icon: String,
    category: String
  }]
}, {
  timestamps: true
});

// Index for better performance
studentSchema.index({ userId: 1 });
studentSchema.index({ 'performanceMetrics.averageScore': -1 });

module.exports = mongoose.model('Student', studentSchema);
