const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    createCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }],
    blockedStatus: {
        type: Boolean,
        default: false,
    },
    // startDate: {
    //     type: Date,
    // },
    // endDate: {
    //     type: Date,
    // },

}, { timestamps: true });

const Instructor = mongoose.model('Instructor', instructorSchema);

module.exports = Instructor;
