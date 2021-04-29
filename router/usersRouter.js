const express = require("express");
const { User } = require("../models/user");
var ObjectId = require("mongoose").Types.ObjectId;
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//get list user exclude passwordHash
router.get("/", async function (req, res) {
  var users = await User.find().select("-passwordHash");
  if (users) {
    res.send(users);
  } else {
    res.status(500).send("Bad server");
  }
});

//get user by id exclude passwordHash
router.get("/:id", async function (req, res) {
  const isValid = ObjectId.isValid(req.params.id);
  if (!isValid) {
    return res.status(400).send("Id not valid");
  }
  let user = await User.findById(req.params.id).select("-passwordHash");
  if (user) {
    res.send(user);
  } else {
    res.status(500).send("User not found");
  }
});
router.get("/get/count", function (req, res) {
  User.countDocuments(function (err, count) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send({ countUsers: count });
    }
  });
});
router.post("/register", async function (req, res) {
  let user = User({
    fullname: req.body.fullname,
    username: req.body.username,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    sex: req.body.sex,
    address: req.body.address,
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
  });
  user
    .save()
    .then((createdUser) => {
      let token = jwt.sign(
        {
          userId: createdUser.id,
          isAdmin: createdUser.isAdmin,
          passwordHash: user.passwordHash,
        },
        process.env.secret,
        {
          expiresIn: 86400,
        }
      );
      res.send({ userId: createdUser.id, token });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        success: false,
      });
    });
});

// login by username and password
router.post("/login", async function (req, res) {
  let user = await User.findOne({ username: req.body.username });

  if (!req.body.username) {
    return res.status(400).send("Vui lòng nhập tài khoản");
  }
  if (!req.body.password) {
    return res.status(400).send("Vui lòng nhập mật khẩu");
  }
  if (!user) {
    return res.status(400).send("Tài khoản không hợp lệ");
  }
  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    let token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
        passwordHash: user.passwordHash,
      },
      process.env.secret,
      {
        expiresIn: 86400,
      }
    );
    res.status(200).send({ auth: true, userID: user.id, token: token });
  } else {
    res.status(400).send("Mật khẩu không chính xác");
  }
});

module.exports = router;
