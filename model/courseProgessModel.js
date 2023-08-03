
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  completedLessons: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  courseStatus: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing',
  },


}, { timestamps: true });

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
