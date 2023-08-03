require('dotenv').config()
const userDb = require('../model/userModel');
const courseDb = require('../model/courseModel');
const cartDb = require('../model/cartModel');
const uuid = require('uuid');




const addToCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { courseId } = req.body;

    const user = await userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }
    const course = await courseDb.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 404, message: "Course not found" });
    }
    if (user.cart.includes(courseId)) {
      return res.status(400).json({ status: 400, message: "Course is already in the cart" });
    }
    const cart = await cartDb.findOne({ userId });
    if (!cart) {
      const newCart = new cartDb({ userId, courses: [courseId], totalAmount: course.price });
      await newCart.save();
      return res.status(200).json({ status: 200, message: "Course added to cart successfully", data: newCart });
    } else {
      cart.courses.push(courseId);
      cart.totalAmount += course.price;
      await cart.save();

      return res.status(200).json({ status: 200, message: "Course added to cart successfully", data: cart });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the course to the cart' });
  }
};


const deleteCourseFromCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courseId = req.body.courseId;
    const cartId = req.body.cartId;

    const user = await userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }
    const course = await courseDb.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 404, message: "Course not found" });
    }
    const cart = await cartDb.findById(cartId);
    if (!cart) {
      return res.status(404).json({ status: 404, message: "Cart Id not found" });
    }
    if (!cart.courses.includes(courseId)) {
      return res.status(400).json({ status: 400, message: "Course is not in the cart" });
    }
    cart.courses = cart.courses.filter((course) => course.toString() !== courseId);
    console.log("courses", cart.courses);
    cart.totalAmount = course.price;
    await cart.save();
    if (cart.courses.length === 0) {
      await cartDb.findByIdAndDelete(cartId);
    }

    res.status(200).json({ status: 200, message: "Course removed from the cart successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while removing the course from the cart' });
  }
};


const getCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("userId", userId);
    const checkUser = await userDb.findById(userId)
    if (!checkUser) {
      return res.status(404).json({ status: 404, message: "User not found" })
    }
    const cart = await cartDb.findOne({ userId }).populate('courses', 'title description price');
    if (!cart) {
      return res.status(404).json({ status: 404, message: "Cart not found" });
    }
    if (cart.courses.length === 0) {
      return res.status(404).json({ status: 404, message: "No Data in Cart" });
    }

    res.status(200).json({ status: 200, message: "Cart retrieved successfully", data: cart.courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the cart' });
  }
};



const buyItemsInCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }
    const cart = await cartDb.findOne({ userId }).populate('courses', 'price');
    if (!cart) {
      return res.status(404).json({ status: 404, message: "Cart not found" });
    }
    if (cart.courses.length === 0) {
      return res.status(404).json({ status: 404, message: "Cart is empty you can't buy" });
    }

    const totalAmount = cart.courses.reduce((acc, course) => acc + course.price, 0);

    // Logic for payment

    const newOrder = new cartDb({
      userId,
      courses: cart.courses ? cart.courses : [],
      totalAmount,
      paymentStatus: true,
    });
    console.log("newOrder", newOrder)
    await newOrder.save();
    cart.courses = [];
    cart.totalAmount = 0;
    cart.paymentStatus = true;
    await cart.save();
    console.log("newOrder", newOrder)
    console.log("cart", cart)

    res.status(200).json({ status: 200, message: "Items in the cart have been purchased successfully", totalAmount, orderId: newOrder.orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the purchase' });
  }
};







module.exports = {
  addToCart,
  deleteCourseFromCart,
  getCart,
  buyItemsInCart,
};
