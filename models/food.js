const mongoose = require("mongoose");
const { Category } = require("./category");
var foodSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,

    default: "",
  },

  image: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    default: 0,
    required: true,
  },
  countInStock: {
    type: Number,
    min: 0,
    max: 200,
    default: 0,
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Category,
    required: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});
// Duplicate the ID field.
foodSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
foodSchema.set("toJSON", {
  virtuals: true,
});
exports.Food = mongoose.model("Food", foodSchema);
