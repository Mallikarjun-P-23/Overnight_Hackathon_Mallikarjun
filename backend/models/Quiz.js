const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  quizTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizTemplate' },
  topic: { type: String, required: true },
  isAdaptive: { type: Boolean, default: false },
  originalQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }, // For repeated quizzes
  questions: [{
    question: String,
    options: [String],
    correctAnswer: String,
    userAnswer: String,
    isCorrect: Boolean
  }],
  score: Number,
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
