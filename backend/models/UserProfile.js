const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  motherTongue: {
    type: String,
    default: 'english',
    enum: ['kannada', 'odia', 'hindi', 'english', 'telugu', 'tamil', 'bengali', 'marathi', 'gujarati', 'punjabi', 'malayalam']
  },
  learningHistory: [{
    timestamp: { type: Date, default: Date.now },
    query: String,
    domain: String,
    motherTongue: String,
    responsePreview: String
  }],
  preferredDomains: [String],
  totalQueries: { type: Number, default: 0 },
  queryPatterns: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);