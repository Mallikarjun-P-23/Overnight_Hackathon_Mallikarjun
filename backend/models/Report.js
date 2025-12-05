const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  topics: [{
    name: String,
    score: Number,
    status: { type: String, enum: ['excellent', 'good', 'needs_improvement'] }
  }],
  overallScore: Number,
  generatedAt: { type: Date, default: Date.now },
  quizTaken: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }
});

module.exports = mongoose.model('Report', reportSchema);
