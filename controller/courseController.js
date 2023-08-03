require('dotenv').config()
const courseDb = require('../model/courseModel');
const userDb = require('../model/userModel');
const ProgressDB = require('../model/courseProgessModel');
const InstructorDb = require('../model/instructorModel');
const reviewDb = require('../model/reviewModel');
const mongoose = require('mongoose');
const request = require('request');
const http = require('http');
const https = require('https');


const { nameRegex, passwordRegex, emailRegex, objectId, isValidBody, isValid, isValidField } = require('../validation/commonValidation')



// video upload function start 
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'videos/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi'],
  },
});
const upload = multer({ storage: storage }).array('courseVideo', 6);
//// video upload function End

// upload Notes Start
const storage1 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'notes/notes',
    allowed_formats: ['pdf', 'doc', 'docx'],
  },
});
const upload1 = multer({ storage: storage1 }).array('courseNotes');
// upload Notes End




const createCourse = async (req, res) => {
  try {
    const data = req.body;
    const { title, description, instructor, duration, price, lessons, weeks, category } = data;

    if (!isValidBody(data)) return res.status(400).json({ status: 400, message: "Body can't be empty, please enter some data" });
    if (!isValid(title)) return res.status(400).json({ status: 400, message: "Title is required" });
    if (!isValid(description)) return res.status(400).json({ status: 400, message: "Description is required" });
    if (!isValid(instructor)) return res.status(400).json({ status: 400, message: "Instructor is required" });
    if (!isValid(duration)) return res.status(400).json({ status: 400, message: "Duration is required" });
    if (!isValid(price)) return res.status(400).json({ status: 400, message: "Price is required" });
    if (!isValid(lessons)) return res.status(400).json({ status: 400, message: "Lesson is required" });
    if (!isValid(weeks)) return res.status(400).json({ status: 400, message: "Weeks is required" });
    if (!isValid(category)) return res.status(400).json({ status: 400, message: "category is required" });


    const existingInstructor = await InstructorDb.findById(instructor);
    if (!existingInstructor) {
      return res.status(404).json({ status: 404, message: "Instructor not found" });
    }

    const newCourse = new courseDb({
      title,
      description,
      instructor,
      duration,
      price,
      lessons,
      weeks,
      category,
    });

    const savedCourse = await newCourse.save();
    await InstructorDb.findByIdAndUpdate(instructor, { $push: { createCourses: savedCourse._id } });

    return res.status(201).json({ status: 201, message: "Course created successfully", data: savedCourse });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};


const getMyCourses = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("userId", userId);

    const checkUser = await userDb.findById(userId);
    if (!checkUser) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }
    const enrolledCourses = checkUser.enrolledCourses;
    console.log("enrolledCourses", enrolledCourses);
    const courseIds = [];

    for (const progressId of enrolledCourses) {
      const progress = await ProgressDB.findById(progressId);
      if (progress) {
        courseIds.push(progress.courseId);
      }
    }
    console.log("courseIds", courseIds);
    const courses = await courseDb.find({ _id: { $in: courseIds } });

    if (courses.length === 0) {
      return res.status(400).json({ status: 400, message: "No Data Found" });
    }
    console.log("courses", courses);
    res.status(200).json({ status: 200, message: "Data get successfully", data: courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the courses' });
  }
};


const getOngoingCourses = async (req, res) => {
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


const saveCourse = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.body.courseId;

    const user = await userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }
    const course = await courseDb.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 404, message: "Course not found" });
    }
    if (user.savedCourses.includes(courseId)) {
      return res.status(400).json({ status: 400, message: "Course is already saved" });
    }
    user.savedCourses.push(courseId);
    await user.save();

    res.status(200).json({ status: 200, message: "Course saved successfully", data: course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while saving the course' });
  }
};


const getSavedCourses = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("userId", userId);
    const checkUser = await userDb.findById(userId)
    if (!checkUser) {
      return res.status(404).json({ status: 404, message: "User not found" })
    }
    const user = await userDb.findById(userId).populate('savedCourses');
    console.log("user", user.savedCourses);

    if (user.savedCourses.length === 0) {
      res.status(200).json({ status: 200, message: "No saved courses found", data: [] });
    } else {
      res.status(200).json({ status: 200, message: "Data retrieved successfully", data: user.savedCourses });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the courses' });
  }
};


const enrollCourse = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.body.courseId;

    const checkUser = await userDb.findById(userId);
    if (!checkUser) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }
    const checkCourse = await courseDb.findById(courseId);
    if (!checkCourse) {
      return res.status(404).json({ status: 404, message: "Course not found" });
    }
    const progress = new ProgressDB({ userId, courseId, completedLessons: 0 });
    await progress.save();

    checkUser.enrolledCourses.push(progress._id);
    await checkUser.save();

    res.status(200).json({ status: 200, message: "Course enrollment successful", data: checkUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while enrolling in the course' });
  }
};


const getCourseDetails = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const course = await courseDb.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 404, message: "Course not found" });
    }

    res.status(200).json({ status: 200, message: "Course details retrieved successfully", data: course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the course details' });
  }
};


const getFeaturedCourses = async (req, res) => {
  try {
    const featuredCourses = await courseDb.find({ isFeatured: true });

    if (featuredCourses.length === 0) {
      return res.status(404).json({ status: 404, message: "No featured courses found" });
    }

    res.status(200).json({ status: 200, message: "Featured courses retrieved successfully", data: featuredCourses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the featured courses' });
  }
};


// const getPopularCourses = async (req, res) => {
//   try {
//     const popularCourses = await courseDb.find().sort({ 'enrolledUsers.length': -1 }).limit(10);

//     if (popularCourses.length === 0) {
//       return res.status(404).json({ status: 404, message: "No popular courses found" });
//     }

//     res.status(200).json({ status: 200, message: "Popular courses retrieved successfully", data: popularCourses });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'An error occurred while fetching the popular courses' });
//   }
// };


const getPopularCourses = async (req, res) => {
  try {
    const users = await userDb.find();
    // console.log("users", users)
    const allEnrolledCourses = users.flatMap((user) => user.enrolledCourses);
    // console.log("allEnrolledCourses", allEnrolledCourses)
    const enrolledCoursesCount = {};
    // console.log("enrolledCoursesCount", enrolledCoursesCount)
    const progressDocs = await ProgressDB.find({ _id: { $in: allEnrolledCourses } });
    // console.log("progressDocs", progressDocs)
    for (const progressDoc of progressDocs) {
      const courseId = progressDoc.courseId.toString();
      enrolledCoursesCount[courseId] = (enrolledCoursesCount[courseId] || 0) + 1;
    }
    const sortedEnrolledCourses = Object.entries(enrolledCoursesCount).sort((a, b) => b[1] - a[1]);
    // console.log("sortedEnrolledCourses", sortedEnrolledCourses)
    const popularCoursesIds = sortedEnrolledCourses.slice(0, 10).map((entry) => entry[0]);
    // console.log("popularCoursesIds", popularCoursesIds)
    const popularCourses = await courseDb.find({ _id: { $in: popularCoursesIds } });
    // console.log("popularCourses", popularCourses)
    if (popularCourses.length === 0) {
      return res.status(404).json({ status: 404, message: "No popular courses found" });
    }

    res.status(200).json({ status: 200, message: "Popular courses retrieved successfully", data: popularCourses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the popular courses' });
  }
};



const getCoursesByCategory = async (req, res) => {
  try {
    const category = req.params.category;

    const courses = await courseDb.find({ category });
    if (courses.length === 0) {
      return res.status(404).json({ status: 404, message: `No courses found for category: ${category}` });
    }
    res.status(200).json({ status: 200, message: `Courses for category: ${category} retrieved successfully`, data: courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the courses' });
  }
};


const updateCourseVideos = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error uploading videos' });
      }
      const videoUrls = req.files.map((file) => file.path);
      if (videoUrls.length > 6) {
        return res.status(400).json({ status: 400, message: 'Exceeded maximum limit of 6 videos per course' });
      }
      try {
        const courseId = req.params.courseId;
        const existingCourse = await courseDb.findById(courseId);
        if (!existingCourse) {
          return res.status(404).json({ status: 404, message: 'Course not found' });
        }
        if (existingCourse.courseVideo.length + videoUrls.length > 6) {
          return res.status(400).json({ status: 400, message: 'Exceeded maximum limit of 6 videos per course' });
        }
        existingCourse.courseVideo.push(...videoUrls);
        const updatedCourse = await existingCourse.save();

        res.status(200).json({ status: 200, message: 'Course videos updated successfully', data: updatedCourse });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while uploading the videos' });
  }
};


const updateCourseNotes = async (req, res) => {
  try {
    upload1(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error uploading course notes', err });
      }
      if (!req.files || req.files.length === 0) {
        console.log('No file uploaded');
        return res.status(400).json({ status: 400, message: 'No file uploaded' });
      }

      const noteUrl = req.files[0].path;
      const courseId = req.params.courseId;
      const course = await courseDb.findByIdAndUpdate(
        courseId,
        { $push: { courseNotes: noteUrl } },
        { new: true }
      );

      if (!course) {
        return res.status(404).json({ status: 404, message: 'Course not found' });
      }

      res.status(200).json({ status: 200, message: 'Course notes updated successfully', data: course });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the course notes' });
  }
};


const getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;
    console.log("instructorId", instructorId);

    const courses = await courseDb.find({ instructor: instructorId });
    // console.log("courses", courses);
    if (courses.length === 0) {
      return res.status(404).json({ status: 404, message: "No courses found for this instructor" });
    }
    res.status(200).json({ status: 200, message: "Courses retrieved successfully", data: courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the courses' });
  }
};



const getInstructorCourseStatistics = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const existingInstructor = await InstructorDb.findById(instructorId);
    if (!existingInstructor) {
      return res.status(404).json({ status: 404, message: "Instructor not found" });
    }
    const courses = await courseDb.find({ instructor: instructorId });
    let filteredCourses = courses;
    if (startDate && endDate) {
      filteredCourses = filteredCourses.filter(
        course => new Date(course.createdAt) >= new Date(startDate) && new Date(course.createdAt) <= new Date(endDate)
      );
    }
    const totalCourses = filteredCourses.length;

    res.status(200).json({
      status: 200,
      message: "Course statistics retrieved successfully",
      data: {
        totalCourses,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the course statistics' });
  }
};



const getInstructorReviews = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;
    console.log("instructorId", instructorId);

    const courses = await courseDb.find({ instructor: instructorId });
    console.log("courses", courses);
    if (courses.length === 0) {
      return res.status(404).json({ status: 404, message: "No courses found for this instructor" });
    }
    const courseIds = courses.map(course => course._id);
    console.log("courseIds", courseIds);

    const reviews = await reviewDb.find({ courseId: { $in: courseIds } });
    console.log("reviews", reviews);

    if (reviews.length === 0) {
      return res.status(404).json({ status: 404, message: "Review not found for this Courses" });
    }

    res.status(200).json({
      status: 200,
      message: "Reviews retrieved successfully",
      data: reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the reviews' });
  }
};



const streamVideo = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const course = await courseDb.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 404, message: 'Course not found' });
    }
    const courseVideos = course.courseVideo;
    if (!courseVideos || courseVideos.length === 0) {
      return res.status(404).json({ status: 404, message: 'No videos found for this course' });
    }
    res.setHeader('Content-Type', 'video/mp4');
    const streamVideoSequentially = (index) => {
      if (index >= courseVideos.length) {
        return res.end();
      }
      const videoUrl = courseVideos[index];
      console.log("videoUrl", videoUrl);
      const requestModule = videoUrl.startsWith('https://') ? https : http;
      requestModule.get(videoUrl, (videoRes) => {
        videoRes.pipe(res, { end: false });
        videoRes.on('end', () => {
          streamVideoSequentially(index + 1);
        });
      }).on('error', (err) => {
        console.error('Error streaming video:', err);
        streamVideoSequentially(index + 1);
      });
    };

    streamVideoSequentially(0);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while streaming the video' });
  }
};









module.exports = {
  createCourse,
  getMyCourses,
  getOngoingCourses,
  saveCourse,
  getSavedCourses,
  enrollCourse,
  getCourseDetails,
  getFeaturedCourses,
  getPopularCourses,
  getCoursesByCategory,
  updateCourseVideos,
  updateCourseNotes,
  getInstructorCourses,
  getInstructorCourseStatistics,
  getInstructorReviews,
  streamVideo
};
