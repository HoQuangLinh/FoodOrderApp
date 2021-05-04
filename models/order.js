const mongoose = require("mongoose");
const { Order_Item } = require("./order_item");
const { User } = require("./user");
let orderSchema = mongoose.Schema({
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Order_Item,
    },
  ],
  shippingAddrees: {
    type: String,
    default: "",
  },

  totalPrice: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  dateOrderd: {
    type: Date,
    default: Date.now,
  },
});
exports.Order = mongoose.model("Order", orderSchema);
