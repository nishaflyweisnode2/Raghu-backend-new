require('dotenv').config()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminDb = require('../model/adminModel');
const courseDb = require('../model/courseModel');
const userDb = require('../model/userModel');
const ProgressDB = require('../model/courseProgessModel');
const InstructorDb = require('../model/instructorModel');
const reviewDb = require('../model/reviewModel');
const CouponDb = require('../model/couponModel');




const { nameRegex, passwordRegex, emailRegex, mobileRegex, objectId, isValidBody, isValid, isValidField } = require('../validation/commonValidation')



const registerAdmin = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, mobileNumber } = req.body;

        if (!isValidBody(req.body)) {
            return res.status(400).json({ status: 400, message: "Body can't be empty, please enter some data" });
        }
        if (!isValid(email)) {
            return res.status(400).json({ status: 400, message: "Email is required" });
        }
        if (!emailRegex.test(email)) {
            return res.status(406).json({ status: 406, message: "Email Id is not valid" });
        }
        if (!isValid(mobileNumber)) {
            return res.status(406).json({ status: 406, message: "Mobile Number is required" });
        }
        if (!mobileRegex.test(mobileNumber)) {
            return res.status(406).json({ status: 406, message: "Mobile Number is not valid" });
        }
        if (!isValid(password)) {
            return res.status(406).json({ status: 406, message: "Password is required" });
        }
        if (!passwordRegex.test(password)) {
            return res.status(406).json({ status: 406, message: "Password is not valid" });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ status: 400, message: "Password and Confirm Password must match" });
        }

        const existingAdmin = await adminDb.findOne({ email });
        if (existingAdmin) {
            return res.status(409).json({ status: 409, message: 'Admin with this email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new adminDb({
            username,
            email,
            password: hashedPassword,
            mobileNumber
        });

        await newAdmin.save();

        res.status(201).json({ message: 'Admin registration successful', data: newAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while registering the admin' });
    }
};



const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!isValidBody(req.body)) return res.status(400).json({ status: 400, message: "Body can't be empty please enter some data" })
        if (!isValid(email)) return res.status(400).json({ status: 400, message: "Email is required" })
        if (!emailRegex.test(email)) return res.status(406).json({ status: 406, message: "Email Id is not valid" })
        if (!isValid(password)) return res.status(406).json({ status: 406, message: "password is required" })
        if (!passwordRegex.test(password)) return res.status(406).json({ status: 406, message: "Password is not valid" })

        const existingAdmin = await adminDb.findOne({ email });
        if (!existingAdmin) {
            return res.status(401).json({ message: 'Admin not found' });
        }
        const isPasswordMatch = await bcrypt.compare(password, existingAdmin.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ status: 401, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ adminId: existingAdmin._id, userType: 'Admin' }, process.env.ADMIN_SECRET_KEY, { expiresIn: '24h' });

        res.status(200).json({ status: 200, message: 'Admin logged in successfully', existingAdmin, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while logging in' });
    }
};



const getAllUsers = async (req, res) => {
    try {
        const users = await userDb.find();
        if (!users) {
            return res.status(404).json({ status: 404, message: 'No data found' });
        }

        res.status(200).json({ status: 200, users: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching users' });
    }
};



const getSpecificUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await userDb.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        res.status(200).json({ status: 200, message: 'User retrieved successfully', data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the user' });
    }
};




const getUserCourses = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("userId", userId);

        const user = await userDb.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }
        const checkCourse = user.enrolledCourses;
        console.log("checkCourse", checkCourse);
        const courseIds = [];
        for (const progressId of checkCourse) {
            const progress = await ProgressDB.findById(progressId);
            if (progress) {
                courseIds.push(progress.courseId);
            }
        }
        console.log("courseIds", courseIds);
        const courses = await courseDb.find({ _id: { $in: courseIds } });
        console.log("courses", courses);
        if (courses.length === 0) {
            return res.status(404).json({ status: 404, message: "Course not found" });
        }

        res.status(200).json({ status: 200, message: 'User courses retrieved successfully', data: courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching user courses' });
    }
};



const adminCanGetOngoingCourses = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("userId", userId);

        const checkUser = await userDb.findById(userId);
        if (!checkUser) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }
        const enrolledCourses = checkUser.enrolledCourses;
        console.log("enrolledCourses", enrolledCourses);
        const validCourseData = [];
        for (const progressId of enrolledCourses) {
            const progress = await ProgressDB.findById(progressId);
            if (progress && progress.courseStatus === "ongoing") {
                const courseId = progress.courseId;
                const course = await courseDb.findById(courseId);
                if (course) {
                    validCourseData.push({ progress, course });
                }
            }
        }
        console.log("validCourseData", validCourseData);

        if (validCourseData.length === 0) {
            return res.status(400).json({ status: 400, message: "No Data Found" });
        }

        res.status(200).json({ status: 200, message: "Data get successfully", data: validCourseData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the courses' });
    }
};



const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await userDb.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }
        if (user.blockedStatus === true) {
            return res.status(400).json({ status: 400, message: 'User already blocked' });
        }
        user.blockedStatus = true;
        await user.save();

        res.status(200).json({ status: 200, message: 'User blocked successfully', data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while blocking the user' });
    }
};




const getAllInstructors = async (req, res) => {
    try {
        const instructors = await InstructorDb.find();
        if (!instructors) {
            return res.status(404).json({ status: 404, message: 'Instructor not found' });
        }
        res.status(200).json({ status: 200, message: 'Instructors retrieved successfully', data: instructors });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching instructors' });
    }
};




const adminCanGetInstructorCourses = async (req, res) => {
    try {
        const instructorId = req.params.instructorId;

        const instructor = await InstructorDb.findById(instructorId);
        if (!instructor) {
            return res.status(404).json({ status: 404, message: 'Instructor not found' });
        }
        const courses = await courseDb.find({ instructor: instructorId });
        if (courses.length === 0) {
            return res.status(404).json({ status: 404, message: 'No courses found for this instructor' });
        }

        res.status(200).json({ status: 200, message: 'Instructor courses retrieved successfully', data: courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching instructor courses' });
    }
};



const AdminCanGetCourseStatistics = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const course = await courseDb.findById(courseId);
        if (!course) {
            return res.status(404).json({ status: 404, message: 'Course not found' });
        }
        const totalEnrolledUsers = course.enrolledUsers ? course.enrolledUsers.length : 0;
        const statistics = {
            totalEnrolledUsers: totalEnrolledUsers,
            averageRating: course.averageRating,
        };

        res.status(200).json({ status: 200, message: 'Course statistics retrieved successfully', data: statistics });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching course statistics' });
    }
};





const AdminCanBlockInstructor = async (req, res) => {
    try {
        const instructorId = req.params.instructorId;

        const instructor = await InstructorDb.findById(instructorId);
        if (!instructor) {
            return res.status(404).json({ status: 404, message: 'Instructor not found' });
        }
        if (instructor.blockedStatus === true) {
            return res.status(400).json({ status: 400, message: 'Instructor already blocked' });
        }
        instructor.blockedStatus = true;
        await instructor.save();

        res.status(200).json({ status: 200, message: 'Instructor blocked successfully', data: instructor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while blocking the instructor' });
    }
};





const AdminCanGenerateCoupon = async (req, res) => {
    try {
        const { code, discountPercentage, validFrom, validTo } = req.body;

        if (!code || !discountPercentage || !validFrom || !validTo) {
            return res.status(400).json({ status: 400, message: 'All fields are required' });
        }
        const existingCoupon = await CouponDb.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ status: 400, message: 'This code is already present in the database' });
        }

        const coupon = new CouponDb({
            code,
            discountPercentage,
            validFrom,
            validTo,
        });

        const savedCoupon = await coupon.save();

        res.status(201).json({ status: 201, message: 'Coupon generated successfully', data: savedCoupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while generating the coupon' });
    }
};




const AdminCanDeleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;

        const coupon = await CouponDb.findOneAndDelete({ _id: couponId });
        if (!coupon) {
            return res.status(404).json({ status: 404, message: 'Coupon not found' });
        }

        res.status(200).json({ status: 200, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the coupon' });
    }
};





const AdminCanModifyCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const { code, discountPercentage, validFrom, validTo } = req.body;

        const existingCoupon = await CouponDb.findById(couponId);
        if (!existingCoupon) {
            return res.status(404).json({ status: 404, message: 'Coupon not found' });
        }
        if (code && code !== existingCoupon.code) {
            const checkCode = await CouponDb.findOne({ code });
            if (checkCode) {
                return res.status(400).json({ status: 400, message: 'This code is already present in the database' });
            }
            existingCoupon.code = code;
        }
        if (discountPercentage) {
            existingCoupon.discountPercentage = discountPercentage;
        }
        if (validFrom) {
            existingCoupon.validFrom = validFrom;
        }
        if (validTo) {
            existingCoupon.validTo = validTo;
        }
        const updatedCoupon = await existingCoupon.save();

        res.status(200).json({ status: 200, message: 'Coupon updated successfully', data: updatedCoupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the coupon' });
    }
};





const getCourseApprovalApplications = async (req, res) => {
    try {
        const pendingCourses = await courseDb.find({ approvalStatus: 'pending' });
        if (pendingCourses.length === 0) {
            return res.status(404).json({ status: 404, message: 'Courses for approval not found' });
        }

        res.status(200).json({ status: 200, message: 'Course approval applications retrieved successfully', data: pendingCourses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching course approval applications' });
    }
};




const approveCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const course = await courseDb.findById(courseId);
        if (!course) {
            return res.status(404).json({ status: 404, message: 'Course not found' });
        }
        if (course.approvalStatus === 'approved') {
            return res.status(400).json({ status: 400, message: 'Course already Approved' });
        }
        course.approvalStatus = 'approved';
        await course.save();

        res.status(200).json({ status: 200, message: 'Course approved successfully', data: course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while approving the course' });
    }
};




const rejectCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const course = await courseDb.findById(courseId);
        if (!course) {
            return res.status(404).json({ status: 404, message: 'Course not found' });
        }
        if (course.approvalStatus === 'rejected') {
            return res.status(400).json({ status: 400, message: 'Course already Rejected' });
        }
        course.approvalStatus = 'rejected';
        await course.save();

        res.status(200).json({ status: 200, message: 'Course rejected successfully', data: course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while rejecting the course' });
    }
};







module.exports = {
    registerAdmin,
    loginAdmin,
    getAllUsers,
    getSpecificUser,
    getUserCourses,
    adminCanGetOngoingCourses,
    blockUser,
    getAllInstructors,
    adminCanGetInstructorCourses,
    AdminCanGetCourseStatistics,
    AdminCanBlockInstructor,
    AdminCanGenerateCoupon,
    AdminCanDeleteCoupon,
    AdminCanModifyCoupon,
    getCourseApprovalApplications,
    approveCourse,
    rejectCourse
};
