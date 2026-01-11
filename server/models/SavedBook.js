const mongoose = require('mongoose');

const savedBookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  googleBookId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  authors: [String],
  thumbnail: String,
  description: String,
  infoLink: String,
  status: {
    type: String,
    enum: ['Reading', 'Completed', 'Want to Read'],
    default: 'Want to Read',
  },
  review: String,
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SavedBook', savedBookSchema);
