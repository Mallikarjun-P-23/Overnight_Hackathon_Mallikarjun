const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetAudience: { 
    type: String, 
    enum: ['all', 'teachers', 'students', 'class'], 
    default: 'all' 
  },
  targetClass: { type: String }, // Optional, if targetAudience is 'class'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
