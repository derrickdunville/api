let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    jwt           = require('jsonwebtoken'),
    ejwt          = require('express-jwt'),
    waterfall     = require('async-waterfall'),
    AccessControl = require('accesscontrol'),
    stripe        = require('stripe')("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT"),
    Product       = mongoose.model('Product')

//
// let grants = {
//     admin: {
//         product: {
//             "read:any": ["*"],
//             "delete:any": ["*"],
//             "update:any": ["*"]
//         }
//     },
//     everyone: {
//         product: {
//             "read:any": ['*', '!password', '!token', '!email'],
//             "delete:own": ['*'],
//             "update:own": ['*']
//         }
//     }
// };

exports.listProducts = function(req, res) {
  // console.log("User Roles: " + req.user.roles);
  // let permission = ac.can(req.user.roles).readAny('product');
  // if(permission.granted){
  Product.find({}, function(err, products) {
      if (err)
          res.status(401).send(err)
      // filter the result set
      // let filteredProducts = permission.filter(JSON.parse(JSON.stringify(products)));
      // console.log('Filtered User List: ' + filteredUsers);
      res.status(201).send(products)
  });
  // } else {
  //     res.status(400).send({err: "You are not authorized to view all products"});
  // }
};

exports.createProduct = function(req, res) {

  // Only admin should be allowed to create products
  // console.log("Creating product...");
  // console.log("Request Body: " + req.body);
  // if(!req.body.username || !req.body.password || !req.body.email) {
  //     res.status(400).send({err: "Must provide username, password, and email"});
  // } else {

  // Error check the request body
  let newProduct = new Product(req.body);

    // Create the equivalent stripe plan if not one-time
  if (newProduct.interval !== 'one-time') {
    console.log("Creating stripe plan...");
    stripe.plans.create({
      amount: newProduct.amount * 100,
      interval: newProduct.interval,
      name: newProduct.name,
      currency: newProduct.currency
    }, function(err, plan) {
        if (err) {
          console.log(err);
          res.status(401).send(err)
        } else {
          console.log(plan);
          newProduct.stripe_plan_id = plan.id
          console.log("Saving product...");
          newProduct.save(function (err, product) {
              if (err) {
                  // console.log("Error creating product!");
                  res.status(401).send(err)
              } else {
                  // console.log("Product created" + product);
                  res.status(201).json(product)
              }
          })
        }
    })
  } else {
    console.log("Saving product...");
    newProduct.save(function (err, product) {
        if (err) {
            // console.log("Error creating product!");
            res.status(401).send(err)
        } else {
            // console.log("Product created" + product);
            res.status(201).json(product)
        }
    })
  }
};

exports.readProduct = function(req, res) {
  // Check the params
  // if(!req.params.productId){
  //     res.status(400).send({err: "You must provide a productId"});
  // }
  // // Check the permission on the resource
  // let permission = ac.can('everyone').readAny('product');
  // if(permission.granted){
  Product.findById(req.params.productId, function(err, product) {
      if (err)
          res.status(401).send(err)
          // Todo: Filter the memebership object
      res.status(201).json(product)
  });
  // } else {
  //     res.status(401).send({err: "Unauthorized"});
  // }
};

exports.updateProduct = function(req, res) {

  // // Check the params
  // if(!req.params.productId){
  //     res.status(400).send({err: "You must provide a productId"});
  // }
  // // Check the permission on the resource
  // let permission = ac.can(req.session.user.roles).updateOwn('product');
  // if(permission.granted){
  Product.findOneAndUpdate(req.params.productId, req.body, {new: true}, function(err, product) {
      if (err)
          res.status(401).send(err)
      res.status(201).json(product)
  });
  // } else {
  //     res.status(400).send({err: "You are not authorized to update products"});
  // }
};

exports.deleteProduct = function(req, res) {
  Product.findOneAndUpdate(req.params.productId, {end_date: new Date()}, {new: true}, function(err, product) {
      if (err)
          res.status(401).send(err)
      res.status(201).json({message: 'product successfully end dated'})
  })
}
