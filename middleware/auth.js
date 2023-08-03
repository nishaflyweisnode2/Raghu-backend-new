require('dotenv').config()
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose")
const userDb = require('../model/userModel');



const authenticateUser = (req, res, next) => {
  const token = req.headers["x-acess-key"];

  if (!token) {
    return res.status(401).json({ status: false, message: 'Authorization token not provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.USER_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ status: false, message: 'Invalid token' });
  }
};

const authorizeUser = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.userType)) {
    return res.status(403).json({ status: false, message: 'You are not authorized to perform this action' });
  }
  next();
};

const authorization = async function (req, res, next) {
  try {
    let decodedToken = req.user;

    let userId = req.params.userId;

    if (!userId) {
      return res.status(400).send({ status: false, message: "userId is required" });
    }
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "please enter a correct userId" });
    }

    const userData = await userDb.findOne({ _id: userId });
    if (!userData) {
      return res.status(404).send({ status: false, message: "userId is not found" });
    }

    if (decodedToken.userId !== userId) {
      return res.status(403).send({ status: false, message: "You are not authorized" });
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};



const authenticateAdmin = (req, res, next) => {
  const token = req.headers["x-acess-key"];

  if (!token) {
    return res.status(401).json({ status: false, message: 'Authorization token not provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY);
    if (decoded.userType !== 'Admin') {
      return res.status(403).json({ status: 403, message: 'You are not authorized to access this resource' });
    }
    req.Admin = decoded;
    next();

  } catch (error) {
    return res.status(403).json({ status: false, message: 'Invalid token' });
  }
};



module.exports = {
  authenticateUser,
  authorizeUser,
  authorization,
  authenticateAdmin
};
