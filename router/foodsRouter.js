const express = require("express");

const router = express.Router();

//upload file
const { multerUploads } = require("../middleware/multer");
const { cloudinary } = require("../config/cloudinary");
const getFileBuffer = require("../middleware/getFileBuffer");
const path = require("path");

//database
const { Category } = require("../models/category");
const { Food } = require("../models/food");
const ObjectId = require("mongoose").Types.ObjectId;

router.get("/", async function (req, res) {
  let filter = {};
  if (req.query.categories) {
    let categoriesQuery = req.query.categories.split(",");
    const checkValidId = categoriesQuery.every((value) =>
      ObjectId.isValid(value)
    );
    if (checkValidId) {
      filter = { category: categoriesQuery };
    } else {
      return res.send("No valid id ");
    }
  }

  let listFoods = await Food.find(filter);

  res.send(listFoods);
});

// get Food by id
router.get(`/:id`, function (req, res) {
  Food.findById(req.params.id)
    .populate("category")
    .exec(function (err, doc) {
      if (err) {
        res.status(500).send(err);
      } else {
        if (doc) {
          res.status(200).send(doc);
          console.log(doc);
        } else {
          res.status(400).send("Not found id");
        }
      }
    });
});
//getCount Food
router.get(`/get/count`, function (req, res) {
  Food.countDocuments(function (err, count) {
    res.status(200).send({ count });
    console.log(count);
  });
});

//get Food is featured
router.get("/get/featured/:id", async function (req, res) {
  var count = req.params.id;
  let Foods = await Food.find({ isFeatured: true }).limit(parseInt(count));

  res.status(200).send(Foods);
});

//Update Food by Id
router.post(`/:id`, async function (req, res) {
  let category = await Category.findById(req.body.category);
  if (!category) {
    return res.status(400).json("Invalid category");
  }

  let updatedFood = {
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    isFeatured: req.body.isFeatured,
    image: req.body.image,
    category: req.body.category,
    countInStock: req.body.countInStock,
  };
  Food.findByIdAndUpdate(
    req.params.id,
    updatedFood,
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

//add Food
router.post("/", multerUploads, async function (req, res) {
  const category = await Category.findById(req.body.category);
  if (!category) {
    return res.status(400).send("Invalid category");
  }
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
    console.log(image);
  }

  const food = new Food({
    image: image,
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    isFeatured: req.body.isFeatured,
    category: req.body.category,
    countInStock: req.body.countInStock,
  });

  //save data to database
  food
    .save()
    .then((createdFood) => {
      res.status(201).json(createdFood);
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
        success: false,
      });
    });
});

router.delete("/:id", function (req, res) {
  Food.findByIdAndDelete(req.params.id, function (err, doc) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (doc) {
        res.status(200).send(doc);
      } else {
        res.status(400).send("Not found id");
      }
    }
  });
});
module.exports = router;
