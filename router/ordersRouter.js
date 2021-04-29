const { Router } = require("express");
const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");
const { Order_Item } = require("../models/order_item");

//get listOrders
router.get("/", async function (req, res) {
  const listOrders = await Order.find().populate("user", "name email");
  res.send(listOrders);
});
//get Order by id
router.get("/:id", async function (req, res) {
  const handle = (promise) => {
    return promise
      .then((data) => [data, undefined])
      .catch((error) => Promise.resolve([undefined, error]));
  };
  const [order, orderErr] = await handle(
    Order.findById(req.params.id).populate({
      path: "orderItems",
      populate: {
        path: "food",
        select: "name price",
        populate: {
          select: "name",
          path: "category",
        },
      },
    })
  );

  if (orderErr) {
    return res.send(orderErr);
  }

  if (!order) {
    res.status(400).send("Order not found");
  } else {
    res.status(200).send(order);
  }
});
//get totalSale
router.get("/get/totalSale", function (req, res) {
  Order.aggregate(
    [
      {
        $group: {
          _id: null,
          totalSale: {
            $sum: "$totalPrice",
          },
        },
      },
    ],
    function (err, result) {
      if (err) {
        res.send(err);
      } else {
        res.status(200).json({ totalSale: result.pop().totalSale });
      }
    }
  );
});

//get Count Orders
router.get("/get/count", function (req, res) {
  Order.countDocuments(function (err, count) {
    if (err) {
      return res.send(err);
    }
    res.status(200).send({ count });
  });
});

// add a order to database
router.post("/", async function (req, res) {
  let orderItemsIds = await req.body.orderItems.map(async (item) => {
    let newOrderItem = Order_Item({
      food: item.food,
      quantity: item.quantity,
    });

    newOrderItem = await newOrderItem.save();
    return newOrderItem._id;
  });

  orderItemsIds = await Promise.all(orderItemsIds);

  let getTotalArrayEachItem = orderItemsIds.map(async (id) => {
    let order_item = await Order_Item.findById(id).populate("food");
    return order_item.food.price * order_item.quantity;
  });
  getTotalArrayEachItem = await Promise.all(getTotalArrayEachItem);
  totalPrice = getTotalArrayEachItem.reduce(
    (accumulator, currentvalue) => accumulator + currentvalue,
    0
  );

  let order = new Order({
    orderItems: orderItemsIds,
    shippingAddrees: req.body.shippingAddrees,
    totalPrice: totalPrice,
    user: req.body.user,
  });
  order
    .save()
    .then((OrderCreated) => {
      res.status(201).json(OrderCreated);
    })
    .catch((err) => res.send(err));
});

//update the status
router.put("/:id", function (req, res) {
  Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true },
    function (err, doc) {
      if (err) {
        res.send(err);
      } else {
        res.send(doc);
      }
    }
  );
});

//delete the order
router.delete("/:id", async function (req, res) {
  //delete Order_item
  let order = await Order.findById(req.params.id);
  let orderItemIds = order.orderItems;
  orderItemIds.forEach((id) => {
    Order_Item.findByIdAndDelete(id, function (err, doc) {
      if (err) {
        console.log(err);
      } else {
        console.log(`${id} is deleted`);
      }
    });
  });

  //console.log(orderItems);
  Order.findByIdAndRemove(req.params.id, function (err, doc) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send("Order is deleted");
    }
  });
});
module.exports = router;
