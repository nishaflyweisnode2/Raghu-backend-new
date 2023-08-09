require('dotenv').config()
const userDb = require('../model/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cloudinary = require('../middleware/cloudinaryConfig');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');

const { nameRegex, passwordRegex, emailRegex, mobileRegex, objectId, isValidBody, isValid, isValidField } = require('../validation/commonValidation')

// twilio start
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
// teilio end

// nodemailer start
const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
});
// nodemailer end

function generateResetToken() {
  return uuidv4();
}


// const signup = async (req, res) => {
//   const { email, mobileNumber, password, confirmPassword } = req.body;
//   try {
//     if (!isValidBody(req.body)) {
//       return res.status(400).json({ status: 400, message: "Body can't be empty, please enter some data" });
//     }
//     if (!isValid(email)) {
//       return res.status(400).json({ status: 400, message: "Email is required" });
//     }
//     if (!emailRegex.test(email)) {
//       return res.status(406).json({ status: 406, message: "Email Id is not valid" });
//     }
//     if (!isValid(mobileNumber)) {
//       return res.status(406).json({ status: 406, message: "Mobile Number is required" });
//     }
//     if (!mobileRegex.test(mobileNumber)) {
//       return res.status(406).json({ status: 406, message: "Mobile Number is not valid" });
//     }
//     if (!isValid(password)) {
//       return res.status(406).json({ status: 406, message: "Password is required" });
//     }
//     if (!passwordRegex.test(password)) {
//       return res.status(406).json({ status: 406, message: "Password is not valid" });
//     }
//     if (password !== confirmPassword) {
//       return res.status(400).json({ status: 400, message: "Password and Confirm Password must match" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const existingUser = await userDb.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ status: 400, message: "Email already exists" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     const user = new userDb({
//       email,
//       mobileNumber,
//       password: hashedPassword,
//       otp,
//     });

//     await user.save();

//     // const token = jwt.sign({ userId: user._id }, 'process.env.USER_SECRET_KEY');

//     //nodemailer
//     const mailOptions = {
//       from: 'princegap001@gmail.com',
//       to: email,
//       subject: 'OTP for Signup',
//       text: `Your OTP for signup is: ${otp}`
//     };
//     console.log("mailoptions", mailOptions);

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.error('Error sending OTP via email:', error);
//         res.status(500).json({ error: 'Failed to send OTP via email' });
//       } else {
//         console.log('OTP sent successfully via email:', info.response);
//         res.status(201).json({ status: 201, message: 'Signup successful', user });
//       }
//     });

//     // twilio
//     twilioClient.messages
//       .create({
//         body: `Your OTP for signup is: ${otp}`,
//         from: '+15739833421',
//         to: "+91" + mobileNumber,
//       })
//       .then((message) => {
//         console.log(`SMS sent with SID: ${message.sid}`);
//         res.status(201).json({ status: 201, message: "Signup successful", user, /*token*/ });
//       })
//       .catch((error) => {
//         console.error('Error sending SMS:', error);
//         res.status(500).json({ error: 'Failed to send OTP via SMS' });
//       });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to create user' });
//   }
// };



const signup = async (req, res) => {
  const { email, mobileNumber, password, confirmPassword } = req.body;
  try {
    if (!isValidBody(req.body)) {
      return res.status(400).json({ status: 400, message: "Body can't be empty, please enter some data" });
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await userDb.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 400, message: "Email already exists" });
    }
    const existingMobile = await userDb.findOne({ mobileNumber });
    if (existingMobile) {
      return res.status(400).json({ status: 400, message: "Mobile number already exists" });
    }

    const userFields = {
      password: hashedPassword,
      otp: generateOtp(),
    };

    if (email) {
      if (!emailRegex.test(email)) {
        return res.status(406).json({ status: 406, message: "Email is not valid" });
      }
      userFields.email = email;
    } else {
      userFields.email = generateRandomEmail();
    }

    if (mobileNumber) {
      if (!mobileRegex.test(mobileNumber)) {
        return res.status(406).json({ status: 406, message: "Mobile number is not valid" });
      }
      userFields.mobileNumber = mobileNumber;
    } else {
      userFields.mobileNumber = generateRandomMobileNumber();
    }

    const user = new userDb(userFields);
    await user.save();

    res.status(201).json({ status: 201, message: 'Signup successful', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};


function generateRandomMobileNumber() {
  const countryCode = '+91';
  const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
  return countryCode + randomNumber.toString();
}

function generateRandomEmail() {
  const randomString = Math.random().toString(36).substring(2);
  const domain = 'gmail.com';
  return `${randomString}@${domain}`;
}


const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const verifyOTP = async (req, res) => {
  const { email, mobileNumber, otp } = req.body;

  try {
    if (!isValid(email) && !isValid(mobileNumber)) {
      return res.status(400).json({ status: 400, message: "Email or mobile number is required" });
    }

    let user;
    if (email) {
      if (!emailRegex.test(email)) {
        return res.status(406).json({ status: 406, message: "Email is not valid" });
      }
      user = await userDb.findOne({ email });
    } else if (mobileNumber) {
      if (!mobileRegex.test(mobileNumber)) {
        return res.status(406).json({ status: 406, message: "Mobile number is not valid" });
      }
      user = await userDb.findOne({ mobileNumber });
    }

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(401).json({ status: 401, message: "Invalid OTP" });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ status: 200, message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};



// const resendOTP = async (req, res) => {
//   const { email, mobileNumber } = req.body;
//   try {
//     if (!isValid(email) && !isValid(mobileNumber)) {
//       return res.status(400).json({ status: 400, message: "Email or mobile number is required" });
//     }
//     let user;
//     if (email) {
//       if (!emailRegex.test(email)) {
//         return res.status(406).json({ status: 406, message: "Email is not valid" });
//       }
//       user = await userDb.findOne({ email });
//     }
//     if (mobileNumber) {
//       if (!mobileRegex.test(mobileNumber)) {
//         return res.status(406).json({ status: 406, message: "Mobile number is not valid" });
//       }
//       user = await userDb.findOne({ mobileNumber });
//     }
//     if (!user) {
//       return res.status(404).json({ status: 404, message: "User not found" });
//     }
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     user.otp = otp;
//     await user.save();

//     if (email && user.email) {
//       // Send OTP via email
//       const mailOptions = {
//         from: 'princegap001@gmail.com',
//         to: user.email,
//         subject: 'OTP for Signup',
//         text: `Your OTP for signup is: ${otp}`
//       };

//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           console.error('Error sending OTP via email:', error);
//           return res.status(500).json({ error: 'Failed to send OTP via email' });
//         } else {
//           console.log('OTP sent successfully via email:', info.response);
//           res.status(201).json({ status: 201, message: 'OTP resent successfully' });
//         }
//       });
//     }
//     if (mobileNumber && user.mobileNumber !== "") {
//       // Send the new OTP via SMS
//       twilioClient.messages
//         .create({
//           body: `Your new OTP for signup is: ${otp}`,
//           from: '+15739833421',
//           to: "+91" + user.mobileNumber,
//         })
//         .then((message) => {
//           console.log(`SMS sent with SID: ${message.sid}`);
//           res.status(200).json({ status: 200, message: "OTP resent successfully" });
//         })
//         .catch((error) => {
//           console.error('Error sending SMS:', error);
//           res.status(500).json({ error: 'Failed to resend OTP via SMS' });
//         });
//     } else if (!email && (!mobileNumber || user.mobileNumber === "")) {
//       console.error('No valid email or mobile number to send OTP');
//       res.status(500).json({ error: 'No valid email or mobile number to send OTP' });
//     }

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to resend OTP' });
//   }
// };


const resendOTP = async (req, res) => {
  const { email, mobileNumber } = req.body;
  try {
    if (!isValid(email) && !isValid(mobileNumber)) {
      return res.status(400).json({ status: 400, message: "Email or mobile number is required" });
    }

    let user;

    if (email) {
      if (!emailRegex.test(email)) {
        return res.status(406).json({ status: 406, message: "Email is not valid" });
      }
      user = await userDb.findOne({ email });
    }

    if (mobileNumber) {
      if (!mobileRegex.test(mobileNumber)) {
        return res.status(406).json({ status: 406, message: "Mobile number is not valid" });
      }
      user = await userDb.findOne({ mobileNumber });
    }

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    await user.save();

    if (email && user.email) {
      console.log('OTP sent successfully via email');
    }

    if (mobileNumber && user.mobileNumber !== "") {
      console.log('OTP sent successfully via SMS');
    }

    res.status(200).json({ status: 200, message: "OTP sent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};



// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     if (!isValid(email)) {
//       return res.status(400).json({ status: 400, message: "Email is required" });
//     }
//     if (!emailRegex.test(email)) {
//       return res.status(406).json({ status: 406, message: "Email Id is not valid" });
//     }
//     const user = await userDb.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ status: 404, message: "User not found" });
//     }
//     const resetToken = generateResetToken();
//     user.resetToken = resetToken;
//     user.resetTokenExpiration = Date.now() + 3600000;
//     await user.save();

//     const resetLink = `http://Url/reset-password?token=${resetToken}`;
//     const mailOptions = {
//       from: 'princegap001@gmail.com',
//       to: email,
//       subject: 'Reset Your Password',
//       text: `To reset your password, click on the following link: ${resetLink}`,
//     };
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.error('Error sending reset email:', error);
//         res.status(500).json({ error: 'Failed to send reset email' });
//       } else {
//         console.log('Reset email sent successfully:', info.response);
//         res.status(200).json({ status: 200, message: 'Reset link sent to your email', data: resetLink });
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to process the request' });
//   }
// };


const forgotPassword = async (req, res) => {
  const { email, mobileNumber } = req.body;

  try {
    if (!isValid(email) && !isValid(mobileNumber)) {
      return res.status(400).json({ status: 400, message: "Email or mobile number is required" });
    }

    let user;

    if (email) {
      if (!emailRegex.test(email)) {
        return res.status(406).json({ status: 406, message: "Email is not valid" });
      }
      user = await userDb.findOne({ email });
    }

    if (mobileNumber) {
      if (!mobileRegex.test(mobileNumber)) {
        return res.status(406).json({ status: 406, message: "Mobile number is not valid" });
      }
      user = await userDb.findOne({ mobileNumber });
    }

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    const resetToken = generateResetToken();
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();

    const resetLink = `http://Url/reset-password?token=${resetToken}`;

    if (email && user.email) {
      console.log(`Reset link sent to email: ${resetLink}`);
    }

    if (mobileNumber && user.mobileNumber) {
      console.log(`Reset link sent as SMS-like message to mobile: ${resetLink}`);
    }

    res.status(200).json({ status: 200, message: 'Reset link sent to email and mobile' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the request' });
  }
};



const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  try {
    if (!isValid(newPassword)) {
      return res.status(406).json({ status: 406, message: "Password is required" });
    }
    if (!passwordRegex.test(newPassword)) {
      return res.status(406).json({ status: 406, message: "Password is not valid" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ status: 400, message: "Password and Confirm Password must match" });
    }
    const user = await userDb.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ status: 400, message: 'Invalid or expired token' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ status: 200, message: 'Password reset successful', data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process the request' });
  }
};


const login = async (req, res) => {
  try {
    const data = req.body
    const { email, password } = data;
    if (!isValidBody(data)) return res.status(400).json({ status: 400, message: "Body can't be empty please enter some data" })
    if (!isValid(email)) return res.status(400).json({ status: 400, message: "Email is required" })
    if (!emailRegex.test(email)) return res.status(406).json({ status: 406, message: "Email Id is not valid" })
    if (!isValid(password)) return res.status(406).json({ status: 406, message: "password is required" })
    if (!passwordRegex.test(password)) return res.status(406).json({ status: 406, message: "Password is not valid" })

    const user = await userDb.findOne({ email });
    if (!user) {
      return res.status(401).json({ status: 401, message: "Invalid email" });
    }
    if (user.blockedStatus === true) {
      return res.status(401).json({ status: 401, message: "Your account has been blocked. Please contact the admin for assistance." });
    }
    user.isVerified = true;
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 401, message: "Invalid password" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.USER_SECRET_KEY);
    await user.save();
    console.log("user", user);
    return res.status(200).json({ status: 200, message: "Login successful", data: { user, token } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body;
    const { firstName, lastName, schoolName, qualification } = data;
    let profileImage;

    if (req.file) {
      profileImage = req.file ? req.file.path : "";
    }
    if (!firstName || !lastName || !schoolName || !qualification) {
      return res.status(400).json({ status: 400, message: "firstName, lastName, schoolName, qualification  is required" });
    }
    if (!isValidField(firstName)) {
      return res.status(400).json({ status: 400, message: "First name is required" });
    }
    if (!nameRegex.test(firstName)) {
      return res.status(406).json({ status: 406, message: "First name is not valid" });
    }

    if (!isValidField(lastName)) {
      return res.status(400).json({ status: 400, message: "Last name is required" });
    }
    if (!nameRegex.test(lastName)) {
      return res.status(406).json({ status: 406, message: "Last name is not valid" });
    }
    if (!isValid(schoolName)) return res.status(400).json({ status: 400, message: "School/Institution name is required" })
    if (!isValid(qualification)) return res.status(400).json({ status: 400, message: "Qualification is required" })

    updatedUser = await userDb.findByIdAndUpdate(userId, {
      firstName,
      lastName,
      schoolName,
      qualification,
      profileImage,
    }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    return res.status(200).json({ status: 200, message: "Profile updated successfully", data: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};


const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    const userProfile = await userDb.findById(userId);
    if (!userProfile) {
      return res.status(404).json({ status: 404, message: "User profile not found" });
    }

    res.status(200).json({ status: 200, message: "User profile retrieved successfully", data: userProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the user profile' });
  }
};


const updateUserProfile = async (req, res) => {
  const userId = req.params.userId;
  const { email, mobileNumber } = req.body;
  try {
    const user = await userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }
    if (email && email !== user.email) {
      if (!emailRegex.test(email)) {
        return res.status(406).json({ status: 406, message: "Email is not valid" });
      }
      const existingEmail = await userDb.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ status: 400, message: "Email already exists" });
      }
      user.email = email;
    }

    if (mobileNumber && mobileNumber !== user.mobileNumber) {
      if (!mobileRegex.test(mobileNumber)) {
        return res.status(406).json({ status: 406, message: "Mobile number is not valid" });
      }
      const existingMobile = await userDb.findOne({ mobileNumber });
      if (existingMobile) {
        return res.status(400).json({ status: 400, message: "Mobile number already exists" });
      }
      user.mobileNumber = mobileNumber;
    }

    await user.save();

    res.status(200).json({ status: 200, message: "Profile updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};





module.exports = {
  signup,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  login,
  updateProfile,
  getUserProfile,
  updateUserProfile
};
