const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const jwt = require("express-jwt");
require("dotenv").config();
const app = express();
const path = require("path");
const { multerUploads } = require("./middleware/multer");
const { cloudinary } = require("./config/cloudinary");
const getFileBuffer = require("./middleware/getFileBuffer");
// Using morgan to see log
app.use(morgan("tiny"));
app.use("/public", express.static(path.join(__dirname, "public")));

// Connect to database
var connectString = process.env.connectString;

mongoose
  .connect(connectString, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((value) => {
    console.log("database connect success");
  })
  .catch((err) => {
    console.log(err);
  });

//middleware
app.use(express.urlencoded()); // Parse URL-encoded bodies
app.use(express.json()); //to support JSON encode

//Authentication;
app.use(
  jwt({
    secret: process.env.secret,
    algorithms: ["HS256"],
    // isRevoked: isRevokedCallBack,
  }).unless({
    path: [
      { url: /\/api\/categories.*/, methods: ["GET"] },
      { url: /\/api\/foods.*/, methods: ["GET"] },
      "/api/users/login",
      "/api/users/register",
    ],
  })
);
function isRevokedCallBack(req, payload, done) {
  if (!payload.isAdmin) return done(null, true);
  return done(null, false);
}
//Router
var foodsRouter = require("./router/foodsRouter");
var categoriesRouter = require("./router/categoriesRouter");
var ordersRouter = require("./router/ordersRouter");
var userRouter = require("./router/usersRouter");

app.use("/api/foods", foodsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/users", userRouter);

//app.listen(3000);

const PORT = process.env.PORT || 3000;
var server = app.listen(PORT, function () {
  var port = server.address().port;
  console.log("Express is working on port", port);
});
