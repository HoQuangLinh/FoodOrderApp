const express = require("express");
const { model } = require("mongoose");

//upload file
const { multerUploads } = require("../middleware/multer");
const { cloudinary } = require("../config/cloudinary");
const getFileBuffer = require("../middleware/getFileBuffer");
const path = require("path");

//use router to navigate to categories API
const router = express.Router();
const { Category } = require("../models/category");

//get all categories
router.get("/", async function (req, res) {
  var listCategories = await Category.find();
  res.send(listCategories);
});
//get category by id
router.get("/:id", function (req, res) {
  let category = Category.findById(req.params.id, function (err, doc) {
    if (err) {
      res.status(500).json({ message: err });
    } else {
      if (doc) {
        res.status(200).json(doc);
        console.log(category);
      } else {
        res.status(400).json({ mesage: "Not found id " });
      }
    }
  });
});

router.post("/", multerUploads, async function (req, res) {
  if (!req.file) {
    return res.status(400).send("Not image choosen");
  }
  if (req.file) {
    const buffer = req.file.buffer;
    const file = getFileBuffer(path.extname(req.file.originalname), buffer);

    //upload file to clould
    var image = await cloudinary.uploader.upload(file, { folder: "Linh" });
    //get imageUrl
    image = image.url;
    console.log(image);
  }
  const filename = req.file.filename;
  var category = new Category({
    name: req.body.name,
    image: image,
  });

  category
    .save()
    .then((createdCategory) => res.send(createdCategory))
    .catch((err) => res.status(500).send({ err }));
});
router.post("/:id", function (req, res) {
  var updatedCategory = {
    name: req.body.name,
    image: req.body.image,
  };
  Category.findByIdAndUpdate(
    req.params.id,
    updatedCategory,
    { new: true },
    function (err, doc) {
      if (err) {
        res.status(500).json({ error: err });
      } else {
        res.status(201).json(doc);
      }
    }
  );
});
router.delete("/:id", function (req, res) {
  Category.findByIdAndDelete(req.params.id, function (err, docs) {
    if (err) {
      res.send(err);
    } else {
      if (docs) {
        res.send("category is deleted");
      } else {
        res.status(404).json({ mesage: "id not found" });
      }
    }
  });
});

module.exports = router;
