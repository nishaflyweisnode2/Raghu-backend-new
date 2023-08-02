require('dotenv').config()
const express = require('express');
const router = express.Router();

const { authenticateUser, authorizeUser, authorization, authenticateAdmin } = require("../middleware/auth");
const { signup, verifyOTP, resendOTP, forgotPassword, resetPassword, login, updateProfile, getUserProfile } = require("../controller/usercontroller");
const {
    createCourse, getMyCourses, getOngoingCourses,
    saveCourse, getSavedCourses, enrollCourse, getCourseDetails, getFeaturedCourses, getPopularCourses, getCoursesByCategory,
    updateCourseVideos, updateCourseNotes, getInstructorCourses, getInstructorCourseStatistics, getInstructorReviews, streamVideo
} = require('../controller/courseController');
const {
    postHelpRequest, getAllHelpRequests,
} = require('../controller/helpController');
const {
    addToCart, deleteCourseFromCart, getCart, buyItemsInCart,
} = require('../controller/cartcontroller');
const {
    postReview, getCourseReviews,
} = require('../controller/reviewController');
const {
    getProgress, updateProgress,
} = require('../controller/courseProgressController')
const { registerInstructor, loginInstructor } = require('../controller/instructorController');
const { createNotification, getNotification, deleteNotification } = require('../controller/notificationController');
const {
    registerAdmin, loginAdmin, getAllUsers, getSpecificUser, getUserCourses, adminCanGetOngoingCourses, blockUser, getAllInstructors, adminCanGetInstructorCourses, AdminCanGetCourseStatistics, AdminCanBlockInstructor, AdminCanGenerateCoupon, AdminCanDeleteCoupon, AdminCanModifyCoupon, getCourseApprovalApplications, approveCourse, rejectCourse
} = require('../controller/adminController');




// upload image Start
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "images/image",
        allowed_formats: ["jpg", "jpeg", "png", "PNG", "xlsx", "xls", "pdf", "PDF"],
    },
});
const upload = multer({ storage: storage });
// upload image End



// user
router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login', login)
router.put('/update-user/:userId', authenticateUser, authorization, upload.single('profileImage'), updateProfile)
router.get('/profile/:userId', authenticateUser, authorization, getUserProfile);



// course
router.post('/courses', createCourse);
router.get('/courses/my-courses/:userId', authenticateUser, authorization, getMyCourses);
router.get('/ongoing-courses/:userId', authenticateUser, authorization, getOngoingCourses);
router.post('/courses/save/:userId', authenticateUser, authorization, saveCourse);
router.get('/getSaved-courses/:userId', authenticateUser, authorization, getSavedCourses);
router.post('/enroll/:userId', authenticateUser, authorization, enrollCourse);
router.get('/courses/:courseId', getCourseDetails);
router.get('/popular-courses', getPopularCourses);
router.get('/courses/category/:category', getCoursesByCategory);
router.put('/courses/:courseId/videos', updateCourseVideos);
router.put('/courses/:courseId/notes', updateCourseNotes);
router.get('/instructor/courses/:instructorId', getInstructorCourses);
router.get('/instructors/:instructorId/courses/statistics', getInstructorCourseStatistics);
router.get('/instructors/:instructorId/reviews', getInstructorReviews);
router.get('/courses/:courseId/stream', streamVideo);





// helper
router.post('/help/:userId', authenticateUser, authorization, postHelpRequest);
router.get('/help/:userId', authenticateUser, authorization, getAllHelpRequests);



// cart
router.post('/cart/add/:userId', authenticateUser, authorization, addToCart);
router.delete('/delete/:userId', authenticateUser, authorization, deleteCourseFromCart);
router.get('/get/:userId', authenticateUser, authorization, getCart);
router.post('/buy/:userId', authenticateUser, authorization, buyItemsInCart);



// review
router.post('/reviews/:userId', authenticateUser, authorization, postReview);
router.get('/courses/:courseId/reviews', getCourseReviews);



// progress of course
router.get('/progress/:userId', authenticateUser, authorization, authorization, getProgress);
router.post('/progress/:userId/:courseId', authenticateUser, authorization, updateProgress);



//instructor 
router.post('/Instructor-register', registerInstructor);
router.post('/Instructor-login', loginInstructor);



// Notification
router.post('/notifications', createNotification)
router.get('/notifications/:userId', getNotification)
router.delete('/notifications/:userId', deleteNotification)



// Admin
router.post('/admin-register', registerAdmin);
router.post('/admin-login', loginAdmin);
router.get('/users', authenticateAdmin, getAllUsers);
router.get('/users/:userId', authenticateAdmin, getSpecificUser);
router.get('/users/:userId/courses', authenticateAdmin, getUserCourses);
router.get('/admin-ongoing-courses/:userId', authenticateAdmin, adminCanGetOngoingCourses);
router.put('/admin/block-user/:userId', authenticateAdmin, blockUser);
router.get('/admin/instructors', authenticateAdmin, getAllInstructors);
router.get('/admin/instructors/:instructorId/courses', authenticateAdmin, adminCanGetInstructorCourses);
router.get('/admin/courses/:courseId/statistics', authenticateAdmin, AdminCanGetCourseStatistics);
router.put('/instructors/:instructorId/block', authenticateAdmin, AdminCanBlockInstructor);
router.post('/coupons', authenticateAdmin, AdminCanGenerateCoupon);
router.delete('/coupon/:couponId', authenticateAdmin, AdminCanDeleteCoupon);
router.put('/coupon/:couponId', authenticateAdmin, AdminCanModifyCoupon);
router.get('/applications', authenticateAdmin, getCourseApprovalApplications);
router.put('/courses/:courseId/approve', authenticateAdmin, approveCourse);
router.put('/courses/:courseId/reject', authenticateAdmin, rejectCourse);
















router.all("/*", (req, res) => { res.status(400).send({ status: false, message: "Endpoint is not correct plese provide a proper end-point" }) })


module.exports = router;
