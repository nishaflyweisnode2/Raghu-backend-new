require('dotenv').config()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const InstructorDb = require('../model/instructorModel');


const { nameRegex, passwordRegex, emailRegex, mobileRegex, objectId, isValidBody, isValid, isValidField } = require('../validation/commonValidation')



const registerInstructor = async (req, res) => {
    try {
        const { email, mobileNumber, password, confirmPassword, firstName, lastName } = req.body;

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

        const existingInstructor = await InstructorDb.findOne({ email });
        if (existingInstructor) {
            return res.status(409).json({ status: 409, message: 'Email already registered' });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newInstructor = new InstructorDb({
            email,
            password: hashedPassword,
            mobileNumber,
            firstName,
            lastName,
        });

        await newInstructor.save();
        res.status(201).json({ status: 201, message: 'Instructor registered successfully', data: newInstructor });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'An error occurred while registering the instructor' });
    }
};


const loginInstructor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!isValidBody(req.body)) return res.status(400).json({ status: 400, message: "Body can't be empty please enter some data" })
        if (!isValid(email)) return res.status(400).json({ status: 400, message: "Email is required" })
        if (!emailRegex.test(email)) return res.status(406).json({ status: 406, message: "Email Id is not valid" })
        if (!isValid(password)) return res.status(406).json({ status: 406, message: "password is required" })
        if (!passwordRegex.test(password)) return res.status(406).json({ status: 406, message: "Password is not valid" })

        const instructor = await InstructorDb.findOne({ email });
        if (!instructor) {
            return res.status(404).json({ status: 404, message: 'Instructor not found' });
        }
        if (instructor.blockedStatus===true) {
            return res.status(401).json({ status: 401, message: "Your account has been blocked. Please contact the admin for assistance." });
          }
        const passwordMatch = await bcrypt.compare(password, instructor.password);
        if (!passwordMatch) {
            return res.status(401).json({ status: 401, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: instructor._id }, process.env.ADMIN_SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({ status: 200, message: 'Instructor logged in successfully', instructor, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while logging in the instructor' });
    }
};



module.exports = {
    registerInstructor,
    loginInstructor
};
