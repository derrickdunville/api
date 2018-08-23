let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    path          = require('path'),
    jwt           = require('jsonwebtoken'),
    ejwt          = require('express-jwt'),
    waterfall     = require('async-waterfall'),
    AccessControl = require('accesscontrol'),
    stripe        = require('stripe')("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT"),
    Product       = mongoose.model('Product'),
    AWS       = require('aws-sdk'),
    s3        = new AWS.S3({apiVersion: '2006-03-01', region: 'us-east-1'});
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
    options.populate = ['file', 'cover_image']
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
  console.log("Request Body: ")
  console.dir(req.body)
  let product = JSON.parse(req.body.product)
  console.log("Files: ")
  console.dir(req.files)
  // if(!req.body.username || !req.body.password || !req.body.email) {
  //     res.status(400).send({err: "Must provide username, password, and email"});
  // } else {

  waterfall([
    function(done){
      // upload the files to s3 and create a S3File/Image model
      if(req.files['cover_image'] != undefined){
        let cover_image = req.files['cover_image'][0] // only 1 in the list
        let newImage = new Image({
          bucket: "ascendtrading/products/cover", // should be a config var
          key: cover_image.originalname,
          image_ext: path.extname(cover_image.originalname)
        })
        let objectParams = {Bucket: newImage.bucket, Key: newImage.key, Body: cover_image.buffer, ACL: "public-read"}
        s3.putObject(objectParams, function(err, data){
          if(err){
            done(err)
          } else {
            newImage.etag = data.etag
            newImage.save().then(image => {
              done(null, image)
            }).catch(err => {
              done(err)
            })
          }
        })
      } else {
        // no cover image, move on
        done(null, null)
      }
    },
    function(coverImage, done){
      if(req.files['uploaded_file'] != undefined){
        // console.dir(req.files['uploaded_file'][0])
        let uploaded_file = req.files['uploaded_file'][0] // only 1 in the list
        let newS3File = new S3File({
          bucket: "ascendtrading/products/files", // should be a config var
          key: uploaded_file.originalname,
          file_ext: path.extname(uploaded_file.originalname)
        })
        let objectParams = {Bucket: newS3File.bucket, Key: newS3File.key, Body: uploaded_file.buffer, ACL: "public-read"}
        s3.putObject(objectParams, function(err, data){
          if(err){
            done(err)
          } else {
            newS3File.etag = data.etag
            newS3File.save().then(s3File => {
              console.log("file saved")
              done(null, s3File, coverImage)
            }).catch(err => {
              done(err)
            })
          }
        })
      } else {
        done(null, null, coverImage)
      }
    },
    function(uploadedFile, coverImage, done){

      // TODO: Error check the request body
      let newProduct = new Product(product);
      // add the file and cover image to the product
      newProduct.cover_image = coverImage
      newProduct.file = uploadedFile
      console.log("creating product")

      // STRIPE: We may need to create a plan on stripe to attach to this new
      // product. If the product is not "one-time" we need to create a plan on stripe
      if (newProduct.interval !== 'one-time') {
        console.log("Creating stripe plan...");
        stripe.plans.create({
          amount: Math.round(newProduct.amount * 100),
          interval: newProduct.interval,
          name: newProduct.name,
          currency: newProduct.currency
        }).then(plan => {
          console.log("plan created")
          console.dir(plan);
          newProduct.stripe_plan_id = plan.id
          let savedProduct = newProduct.save()
          savedProduct.then(product => {
            console.log("Product created" + product);
            res.status(201).json(product)
          }).catch(err => {
            console.log("Error creating product!");
            done(err)
          })
        }).catch(err => {
          console.error(err)
          done(err)
        })
      } else {
        console.log("Saving product...");
        let savedProduct = newProduct.save()
        savedProduct.then(product => {
          res.status(201).json(product)
        }).catch(err => {
          done(err)
        })
      }
    }
  ],
  function(err){
    console.error(err)
    res.status(400).send(err) // BAD REQUEST
  })
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
