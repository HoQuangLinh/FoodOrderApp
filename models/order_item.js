const mongoose = require("mongoose");
const { Food } = require("./food");
let order_itemSchema = mongoose.Schema({
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Food,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});
exports.Order_Item = mongoose.model("Order_Item", order_itemSchema);
