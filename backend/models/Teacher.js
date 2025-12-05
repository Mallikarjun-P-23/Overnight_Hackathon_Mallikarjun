const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String },
  studentsCount: { type: Number, default: 0 },
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  loginHistory: [{ date: Date, duration: Number }],
  lastActive: { type: Date, default: Date.now },
  activityLevel: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
});

module.exports = mongoose.model('Teacher', teacherSchema);
