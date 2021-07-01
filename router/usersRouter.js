const express = require("express");
const { User } = require("../models/user");
var ObjectId = require("mongoose").Types.ObjectId;
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const sendEmail = require("../middleware/sendEmail");

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
    exponentPushToken: req.body.exponentPushToken,
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
router.post("/resetPassword", async function (req, res) {
  const email = req.body.email;
  const authenEmail = Math.floor(Math.random() * (9999 - 0000 + 1));
  await sendEmail(
    email,
    "Vui lòng lấy mã xác thực sau để reset mật khẩu",
    `${authenEmail}`
  )
    .then((x) =>
      User.findOneAndUpdate(
        { email: email },
        { authenEmail: authenEmail },
        function (err, docs) {
          if (err) {
            console.log(err);
            res.status(500).send(err);
          } else {
            console.log("Updated Docs : ", docs);
            res.status(200).send("Mã xác thực đã được gửi qua email");
          }
        }
      )
    )
    .catch((err) => res.status(500).send(err));
});

//Sử dụng để đổi mật khẩu cho user
router.post("/changePassword/:userId", async function (req, res) {
  //Kiểm tra xem đã nhập userId vào đường link hau chưa
  const isValid = ObjectId.isValid(req.params.userId);
  const password = req.body.password;
  const newPassword = req.body.newPassword;
  //Kiểm tra xem Id có hợp lệ hay không
  if (!isValid) {
    return res.status(400).send("Id not valid");
  }
  //Kiểm tra xem người dùng nhập mật khẩu hay chưa
  if (!password) {
    return res.status(400).send("Vui lòng nhập mật khẩu cũ ");
  }
  //Kiểm tra xem người dùng có nhập đúng mật khẩu cũ hay không

  const user = await User.findById(req.params.userId).select("passwordHash");

  //So sánh mật khẩu người dùng nhập vào với mật khẩu trên database
  if (user && bcrypt.compareSync(password, user.passwordHash)) {
    //Thay đổi mật khẩu cho user
    console.log("Thay đổi mật khẩu thành công");
    try {
      User.findByIdAndUpdate(
        req.params.userId,
        {
          passwordHash: bcrypt.hashSync(newPassword, 10),
        },
        { new: true },
        function (err, docs) {
          if (err) {
            console.log(err);
            res.status(500).send(err);
          } else {
            console.log("Updated Docs : ", docs);
            res.status(200).send("Thay đổi mật khẩu thành công");
          }
        }
      );
    } catch (error) {
      res.status(500).send("Lỗi server");
    }
  } else {
    res.status(400).send("Bạn đã nhập mật khẩu sai");
  }
});

router.post("/changePasswordWithAuthenEmail", async function (req, res) {
  //Cần mã xác thực + mật khẩu mới để update mật khẩu
  var countAuthen = false;
  if (!req.body.authenEmail) {
    return res.status(400).send("Bạn chưa nhập mã xác thực");
  }
  await User.countDocuments(
    { authenEmail: req.body.authenEmail },
    function (err, count) {
      if (err) {
        res.status(500).send(err);
      } else {
        countAuthen = count;
      }
    }
  );
  if (countAuthen) {
    console.log("Da xac thuc");
    try {
      User.findOneAndUpdate(
        { authenEmail: req.body.authenEmail },
        {
          passwordHash: bcrypt.hashSync(req.body.password, 10),
          authenEmail: "",
        },
        function (err, docs) {
          if (err) {
            console.log(err);
            res.status(500).send(err);
          } else {
            console.log("Updated Docs : ", docs);
            res.status(200).send("Thay đổi mật khẩu thành công");
          }
        }
      );
    } catch (error) {
      console.log("Lỗi xác thực");
    }
  } else {
    res.status(400).send("Ma xac thuc khong chinh xac");
  }
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
    res.status(200).send({
      auth: true,
      userID: user.id,
      token: token,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(400).send("Mật khẩu không chính xác");
  }
});

module.exports = router;
