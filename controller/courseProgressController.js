require('dotenv').config()
const ProgressDB = require('../model/courseProgessModel');
const reviewDb = require('../model/reviewModel');
const userDb = require('../model/userModel');
const courseDb = require('../model/courseModel');
const cartDb = require('../model/cartModel');



const getProgress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const courseId = req.body.courseId;
        const user = await userDb.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }
        const progress = await ProgressDB.findOne({ userId, courseId });
        if (!progress) {
            return res.status(404).json({ status: 404, message: "Progress not found" });
        }

        res.status(200).json({ status: 200, message: "Progress retrieved successfully", data: progress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the progress' });
    }
};


const updateProgress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const courseId = req.params.courseId;
        const { completedLessons } = req.body;

        const user = await userDb.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }
        if (completedLessons < 0 || completedLessons > 100) {
            return res.status(400).json({ status: 400, message: "Completed lessons value must be between 0 and 100" });
        }
        const course = await courseDb.findById(courseId);
        if (!course) {
            return res.status(404).json({ status: 404, message: 'Course not found' });
        }
        let progress = await ProgressDB.findOneAndUpdate(
            { userId, courseId },
            { completedLessons },
            { new: true, upsert: true }
        );
        if (progress.completedLessons === 100) {
            progress.courseStatus = 'completed';
            await progress.save();
        }

        res.status(200).json({ status: 200, message: "Progress updated successfully", data: progress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the progress' });
    }
};


module.exports = {
    getProgress,
    updateProgress,
};
