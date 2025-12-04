const mongoose = require('mongoose');

const quizTemplateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    targetClass: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    questions: [{
        question: String,
        options: [String],
        correctAnswer: String
    }],
    scheduledAt: { type: Date },
    durationMinutes: { type: Number, default: 30 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizTemplate', quizTemplateSchema);
