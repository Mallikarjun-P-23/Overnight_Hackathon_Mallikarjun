const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String },
  class: { type: String },
  enrolledAt: { type: Date, default: Date.now },
  totalScore: { type: Number, default: 0 },
  topics: [String],
  weeklySessions: [{ date: Date, duration: Number }]
});

module.exports = mongoose.model('Student', studentSchema);
