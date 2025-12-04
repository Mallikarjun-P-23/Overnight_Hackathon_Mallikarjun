const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  topic: { type: String, required: true },
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
