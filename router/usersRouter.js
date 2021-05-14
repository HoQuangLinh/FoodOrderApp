const express = require("express");
const { User } = require("../models/user");
var ObjectId = require("mongoose").Types.ObjectId;
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//upload file
const { multerUploads } = require("../middleware/multer");
const { cloudinary } = require("../config/cloudinary");
const getFileBuffer = require("../middleware/getFileBuffer");
const path = require("path");

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
    email: req.body.email,
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
//update User by Id
router.put("/avatar/:id", multerUploads, async function (req, res) {
  if (!req.file) {
    return res.send("Not image choosen");
  }
  if (req.file) {
    const buffer = req.file.buffer;
    const file = getFileBuffer(path.extname(req.file.originalname), buffer);

    //upload file to clould
    var image = await cloudinary.uploader.upload(file, { folder: "Linh" });
    //get imageUrl
    image = image.url;
  }
  let updateUser = {
    image: image,
  };
  User.findByIdAndUpdate(
    req.params.id,
    updateUser,
    { new: true },
    function (err, doc) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(doc);
      }
    }
  );
});

router.post("/imageBackground/:id", multerUploads, async function (req, res) {
  if (!req.file) {
    return res.send("Not image choosen");
  }
  if (req.file) {
    const buffer = req.file.buffer;
    const file = getFileBuffer(path.extname(req.file.originalname), buffer);

    //upload file to clould
    var imageBackground = await cloudinary.uploader.upload(file, {
      folder: "Linh",
    });
    //get imageUrl
    imageBackground = imageBackground.url;
  }
  let updateUser = {
    imageBackground: imageBackground,
  };
  User.findByIdAndUpdate(
    req.params.id,
    updateUser,
    { new: true },
    function (err, doc) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(doc);
      }
    }
  );
});

router.post("/userdetail/:id", function (req, res) {
  let updatedUser = {
    fullname: req.body.fullname,
    email: req.body.email,
    sex: req.body.sex,
    address: req.body.address,
    phone: req.body.phone,
    birthday: req.body.birthday,
  };
  User.findByIdAndUpdate(
    req.params.id,
    updatedUser,
    { new: true },
    function (err, doc) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(doc);
      }
    }
  );
});

//update address for user
router.post("/updateAddress/:id", function (req, res) {
  let updatedUser = {
    address: req.body.address,
  };
  User.findByIdAndUpdate(
    req.params.id,
    updatedUser,
    { new: true },
    function (err, doc) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(doc);
      }
    }
  );
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
