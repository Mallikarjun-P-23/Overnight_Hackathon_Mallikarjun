const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  quizId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz'
  },
  quizTitle: { 
    type: String, 
    required: true 
  },
  topic: { 
    type: String, 
    required: true 
  },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: String,
    userAnswer: String,
    isCorrect: Boolean,
    timeTaken: Number, // in seconds
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
  }],
  totalQuestions: { 
    type: Number, 
    required: true 
  },
  correctAnswers: { 
    type: Number, 
    required: true 
  },
  score: { 
    type: Number, 
    required: true 
  }, // Percentage score
  rawScore: { 
    type: Number, 
    required: true 
  }, // Actual points earned
  maxScore: { 
    type: Number, 
    required: true 
  }, // Maximum possible points
  timeTaken: { 
    type: Number 
  }, // Total time in seconds
  completedAt: { 
    type: Date, 
    default: Date.now 
  },
  attemptNumber: { 
    type: Number, 
    default: 1 
  },
  isRetake: { 
    type: Boolean, 
    default: false 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  },
  category: { 
    type: String, 
    default: 'general' 
  },
  feedback: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String]
  }
}, {
  timestamps: true
});

// Index for better query performance
quizResultSchema.index({ studentId: 1, completedAt: -1 });
quizResultSchema.index({ userId: 1, topic: 1 });

module.exports = mongoose.model('QuizResult', quizResultSchema);
