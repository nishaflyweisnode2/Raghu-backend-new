const { boolean } = require('joi');
const mongoose = require('mongoose');
const uuid = require('uuid');


const cartSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
  ],
  totalAmount: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: Boolean,
    defalut: false
  },
  orderId: {
    type: String,
    unique: true,
    default: () => uuid.v4(),
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },

}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
