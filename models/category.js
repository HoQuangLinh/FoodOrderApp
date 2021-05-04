const mongoose = require("mongoose");
var categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  image: {
    type: String,
  },
});
categorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
categorySchema.set("toJSON", {
  virtuals: true,
});
exports.Category = mongoose.model("Category", categorySchema);
