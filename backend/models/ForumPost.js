const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    language: {
        type: String,
        enum: ['Konkani', 'Marathi', 'Hindi', 'Kannada', 'English'],
        required: true
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
        type: String,
        enum: ['Discussion', 'Q&A', 'Resource'],
        default: 'Discussion'
    },
    replies: [{
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ForumPost', forumPostSchema);
