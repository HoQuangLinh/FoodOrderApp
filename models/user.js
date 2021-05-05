const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");
let user_Schema = mongoose.Schema({
  email: {
    type: String,
  },
  username: {
    type: String,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  sex: {
    type: String,
  },
  address: {
    type: String,
  },
  phone: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
    required: true,
  },
  image: {
    type: String,
  },
});
// Apply the uniqueValidator plugin to userSchema.
user_Schema.plugin(uniqueValidator);
exports.User = mongoose.model("User", user_Schema);
