require('dotenv').config()
const courseDb = require('../model/courseModel');
const userDb = require('../model/userModel');
const ProgressDB = require('../model/courseProgessModel');
const InstructorDb = require('../model/instructorModel');
const reviewDb = require('../model/reviewModel');
const notificationDb = require('../model/notificationModel');
const mongoose = require('mongoose');




const createNotification = async (req, res) => {
    try {
        const { title, message, type, userId } = req.body;

        const checkUser = await userDb.findById(userId);
        if (!checkUser) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }
        const userIds = userId.map(id => mongoose.Types.ObjectId.createFromHexString(id));

        const notification = new notificationDb({
            title: title,
            message: message,
            type: type,
            user: userIds,
        });

        const savedNotification = await notification.save();

        res.status(201).json({
            status: 201,
            message: "Notification created successfully",
            data: savedNotification,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the notification' });
    }
};



const getNotification = async (req, res) => {
    try {
        const userId = req.params.userId;

        const checkUser = await userDb.findById(userId);
        if (!checkUser) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }
        const notifications = await notificationDb.find({ user: userId }).sort({ createdAt: -1 });
        if (notifications.length === 0) {
            return res.status(404).json({ status: 404, message: "No notifications found for the user" });
        }

        res.status(200).json({ status: 200, message: "Notifications retrieved successfully", data: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the notifications' });
    }
};



const deleteNotification = async (req, res) => {
    try {
        const userId = req.params.userId;

        const checkUser = await userDb.findById(userId);
        if (!checkUser) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }
        const deleteResult = await notificationDb.deleteMany({ user: userId });

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ status: 404, message: "No notifications found for the user" });
        }

        res.status(200).json({ status: 200, message: "Notifications deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the notifications' });
    }
};




module.exports = {
    getNotification,
    deleteNotification,
    createNotification
}