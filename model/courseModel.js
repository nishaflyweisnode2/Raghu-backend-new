const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    lessons: {
        type: String,
        required: true,
    },
    weeks: {
        type: String,
        required: true,
    },
    courseImage: {
        type: String,
    },
    category: {
        type: String,
        required: true,
    },
    courseVideo: [{
        type: String,
    }],
    courseNotes: [{
        type: String,
    }],
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
