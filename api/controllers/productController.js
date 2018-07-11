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
    let query = {}
    if(req.query._id !== undefined){
      query._id = req.query._id
    }
    if(req.query.name !== undefined){
      query.name = {'$regex': req.query.name, '$options': 'i'}
    }
    if(req.query.category !== undefined){
      query.category = {'$regex': req.query.category, '$options': 'i'}
    }

    // Handle parsing sort
    let sort = {}
    if(req.query.sort !== undefined){
      console.log(req.query.sort)
      var sortList = req.query.sort.split(",")
      for(var i = 0; i < sortList.length; ++i){
        var direction = -1
        var sortTypeArray = sortList[i].split(":")
        var column = sortTypeArray[0]
        if(sortTypeArray.length > 1){
          if(sortTypeArray[1] === "asc"){
            direction = 1
          }
        }
        sort[column] = direction
      }
    }
    console.log("Query: " + JSON.stringify(query))
    console.log("Sort: " + JSON.stringify(sort))
    console.log("Limit: " + req.query.limit)
    let options = {}
    /* Handle parsing current page */
    if (req.query.page === undefined) {
      options.page = 1
    } else {
      options.page = parseInt(req.query.page)
    }

    /* Handle parsing limit */
    if(req.query.limit === undefined){
      options.limit = 10
    } else {
      if(parseInt(req.query.limit) > 100){
        options.limit = 100
      } else {
        options.limit = parseInt(req.query.limit)
      }
    }

    if(sort != {}){
      options.sort = sort
    }
    options.lean = true
    console.log("Options: " + JSON.stringify(options))
    // console.log("Options: " + JSON.stringify(options))

    // let permission = ac.can(req.user.roles).readAny('user');
    // if(permission.granted){

    // } else {
    //     res.status(400).send({err: "You are not authorized to view all users"});
    // }

    Product.paginate(query, options, function(err, products) {
      if(err){
        console.log(err)
        res.status(401).send({err: 'Error getting products'})
      } else {
        /**
         * Response looks like:
         * {
         *   docs: [...] // array of Posts
         *   total: 42   // the total number of Posts
         *   limit: 10   // the number of Posts returned per page
         *   page: 2     // the current page of Posts returned
         *   pages: 5    // the total number of pages
         * }
        */
        // console.dir("products: " + JSON.stringify(products))
        res.status(201).send(products);

      }
    });
};


exports.createProduct = function(req, res) {

  // Only admin should be allowed to create products
  // console.log("Creating product...");
  console.log("Request Body: ");
  console.dir(req.body)
  // if(!req.body.username || !req.body.password || !req.body.email) {
  //     res.status(400).send({err: "Must provide username, password, and email"});
  // } else {

  // Error check the request body
  let newProduct = new Product(req.body);

    // Create the equivalent stripe plan if not one-time
  if (newProduct.interval !== 'one-time') {
    console.log("Creating stripe plan...");
    stripe.plans.create({
      amount: Math.round(newProduct.amount * 100),
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
                  console.log("Error creating product!");
                  res.status(401).send(err)
              } else {
                  console.log("Product created" + product);
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
