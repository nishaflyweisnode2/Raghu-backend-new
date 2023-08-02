require('dotenv').config()
const userDb = require('../model/userModel');
const helpDb = require('../model/helpModel');
const user = require('../model/userModel');


const postHelpRequest = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("userId", userId);
    const checkUser = await userDb.findById(userId)
    if (!checkUser) {
      return res.status(404).json({ status: 404, message: "User not found" })
    }
    const { subject, message } = req.body;

    const user = await userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    const helpRequest = new helpDb({
      user: userId,
      subject,
      message,
    });

    const savedHelpRequest = await helpRequest.save();

    res.status(200).json({ status: 200, message: "Help request submitted successfully", data: savedHelpRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while submitting the help request' });
  }
};


const getAllHelpRequests = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("userId", userId);
    const checkUser = await userDb.findById(userId)
    if (!checkUser) {
      return res.status(404).json({ status: 404, message: "User not found" })
    }
    const helpRequests = await helpDb.find({ user: userId }).populate('user', 'firstName lastName email mobileNumber');
    if (helpRequests.length === 0) {
      return res.status(404).json({ status: 404, message: "No data found" })
    }
    res.status(200).json({ status: 200, message: "All help requests retrieved successfully", data: helpRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the help requests' });
  }
};

module.exports = {
  postHelpRequest,
  getAllHelpRequests,
};
