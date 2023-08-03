require('dotenv').config()
const reviewDb = require('../model/reviewModel');
const userDb = require('../model/userModel');
const courseDb = require('../model/courseModel');
const cartDb = require('../model/cartModel');




const postReview = async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const userId = req.params.userId;
    const user = await userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }
    const checkCourseUser = await courseDb.findOne({ enrolledUsers: userId });
    if (!checkCourseUser) {
      return res.status(404).json({ status: 404, message: "You must enroll in this course before posting a review" });
    }
    if (checkCourseUser._id.toString() !== courseId) {
      return res.status(400).json({ status: 400, message: "Invalid courseId" });
    }
    const existingReview = await reviewDb.findOne({ courseId, userId });
    if (existingReview) {
      return res.status(400).json({ status: 400, message: "You have already reviewed this course" });
    }
    const review = new reviewDb({
      courseId,
      userId,
      rating,
      comment,
    });
    await review.save();

    res.status(201).json({ status: 201, message: "Review posted successfully", data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while posting the review' });
  }
};



const getCourseReviews = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const reviews = await reviewDb.find({ courseId }).populate('userId',);

    if (reviews.length === 0) {
      return res.status(404).json({ status: 404, message: "No reviews found for this course" });
    }

    res.status(200).json({ status: 200, message: "Reviews retrieved successfully", data: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the reviews' });
  }
};




module.exports = {
  postReview,
  getCourseReviews,
};
