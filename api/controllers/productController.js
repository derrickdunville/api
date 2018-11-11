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


let grants = {
  admin: {
    product: {
      "read:any": ["*"],
      "create:any": ["*"],
      "delete:any": ["*"],
      "update:any": [
        "file",
        "cover_image",
        "description"
      ]
    }
  },
  everyone: {
    product: {
      "read:any": ['*', '!file', '!stripe_plan_id', '!discord_role_id']
    }
  },
  public: {
    product: {
      "read:any": ['*', '!file', '!stripe_plan_id', '!discord_role_id']
    }
  }
};

let ac = new AccessControl(grants);

exports.listProducts = function(req, res) {

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
      // console.log(req.query.sort)
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
    // console.log("Query: " + JSON.stringify(query))
    // console.log("Sort: " + JSON.stringify(sort))
    // console.log("Limit: " + req.query.limit)
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
    // console.log("Options: " + JSON.stringify(options))
    // console.log("Options: " + JSON.stringify(options))

    options.populate = ['file', 'cover_image']

    let readPermission = ac.can(req.user.roles).readAny('product')
    if(readPermission.granted){
      Product.paginate(query, options)
      .then(products => {
        /**
         * products looks like:
         * {
         *   docs: [...] // array of Posts
         *   total: 42   // the total number of Posts
         *   limit: 10   // the number of Posts returned per page
         *   page: 2     // the current page of Posts returned
         *   pages: 5    // the total number of pages
         * }
        */
        let filteredProducts = readPermission.filter(JSON.parse(JSON.stringify(products.docs)))
        products.docs = filteredProducts
        res.status(201).send(products);
      }).catch(err => {
        console.log(err)
        res.status(500).send({err: err})
      })
    } else {
        res.status(401).send({err: "You are not authorized to read products"});
    }
};

exports.createProduct = function(req, res) {

  // Only admin should be allowed to create products
  // console.log("Creating product...");
  // console.log("Request Body: ")
  // console.dir(req.body)
  let product = JSON.parse(req.body.product)
  // console.log("Files: ")
  // console.dir(req.files)
  // if(!req.body.username || !req.body.password || !req.body.email) {
  //     res.status(400).send({err: "Must provide username, password, and email"});
  // } else {

  // Check the permission on the resource
  let permission = ac.can(req.user.roles).createAny('product');
  if(permission.granted){
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
                // console.log("file saved")
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
        // console.log("creating product")

        // STRIPE: We may need to create a plan on stripe to attach to this new
        // product. If the product is not "one-time" we need to create a plan on stripe
        if (newProduct.interval !== 'one-time') {
          // console.log("Creating stripe plan...");
          stripe.plans.create({
            amount: Math.round(newProduct.amount * 100),
            interval: newProduct.interval,
            name: newProduct.name,
            currency: newProduct.currency
          }).then(plan => {
            // console.log("plan created")
            // console.dir(plan);
            newProduct.stripe_plan_id = plan.id
            let savedProduct = newProduct.save()
            savedProduct.then(product => {
              // console.log("Product created" + product);
              res.status(201).json(product)
            }).catch(err => {
              // console.log("Error creating product!");
              done(err)
            })
          }).catch(err => {
            // console.error(err)
            done(err)
          })
        } else {
          // console.log("Saving product...");
          let savedProduct = newProduct.save()
          savedProduct.then(product => {
            req.app.io.sockets.in('ADMIN').emit('PRODUCT_CREATED_EVENT', product)
            res.status(201).json(product)
          }).catch(err => {
            done(err)
          })
        }
      }
    ],
    function(err){
      // console.error(err)
      res.status(400).send(err) // BAD REQUEST
    })
  } else {
      res.status(401).send({err: {message: "You are not authorized to create products"}});
  }
};

exports.readProduct = function(req, res) {

  // Check the permission on the resource
  let readPermission = ac.can(req.user.roles).readAny('product');
  if(readPermission.granted){
    // console.log("read product permission granted")
    // console.log("finding product with id: " + req.params.productId)
    Product.findById(req.params.productId)
    .populate({path: 'cover_image'})
    .then(product => {
      if(product == null){
        res.status(404).send({err: {message: "product not found"}})
      } else {
        let filteredProduct = readPermission.filter(JSON.parse(JSON.stringify(product)))
        res.status(201).json(filteredProduct)
      }
    }).catch(err => {
      // console.dir(err)
      res.status(500).send({err: err})
    })
  } else {
      res.status(401).send({err: "you are not authorized to read products"});
  }
};

exports.updateProduct = function(req, res) {

  // What are we allowed to update?
  // For any product we can not change the category of the product
  // For products with a billing plan we can not change any billing details

    // Only admin should be allowed to create products
    // console.log("Creating product...");
    // console.log("Request Body: ")
    // console.dir(req.body)
    let product = JSON.parse(req.body.product)
    // console.log("Files: ")
    // console.dir(req.files)
    // if(!req.body.username || !req.body.password || !req.body.email) {
    //     res.status(400).send({err: "Must provide username, password, and email"});
    // } else {

    // Check the permission on the resource
    let updatePermission = ac.can(req.user.roles).updateAny('product')
    let readPermission = ac.can(req.user.roles).readAny('product')
    if(updatePermission.granted){
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
                  // console.log("file saved")
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
          let productUpdates = JSON.parse(req.body.product)
          // add the file and cover image to the product
          if(coverImage != null)
            productUpdates.cover_image = JSON.parse(JSON.stringify(coverImage))._id
          if(uploadedFile != null)
            productUpdates.file = JSON.parse(JSON.stringify(uploadedFile))._id
          // console.log("creating product")
          let filteredUpdates = updatePermission.filter(productUpdates)
          Product.findOneAndUpdate({_id: req.params.productId}, filteredUpdates, {runValidators: true, context: 'query', new: true})
          .populate({path: 'cover_image'})
          .populate({path: 'file'})
          .then(product => {
            let filteredProduct = readPermission.filter(JSON.parse(JSON.stringify(product)))
            // req.app.io.sockets.emit('user-updated', filteredUser)
            // EMIT product updated socket
            req.app.io.sockets.in('ADMIN').emit('PRODUCT_UPDATED', filteredProduct)
            res.status(201).send(filteredProduct);
          }).catch(err => {
            done(err)
          })
        }
      ],
      function(err){
        console.error(err)
        res.status(400).send({err: err}) // BAD REQUEST
      })
    } else {
        res.status(401).send({err: {message: "You are not authorized to update products"}});
    }
  };

exports.deleteProduct = function(req, res) {
  let deletePermission = ac.can(req.user.roles).deleteAny('product');
  let readPermission = ac.can(req.user.roles).readAny('product')
  if(deletePermission.granted){
    Product.findOneAndUpdate({_id: req.params.productId}, {end_date: new Date()}, {new: true})
    .populate({path: 'cover_image'})
    .then(product => {
      if(product == null){
        res.status(404).send({err: {message: "product not found"}})
      } else {
        let filteredProduct = readPermission.filter(JSON.parse(JSON.stringify(product)))
        res.status(201).send(filteredProduct)
      }
    }).catch(err => {
      res.status(500).send({err: err})
    })
  } else {
    res.status(401).json({message: 'You are not authorized to delete products'})
  }
}


exports.downloadProduct = function(req, res) {
  // check to make sure that the user has a succeeded transaction for the product id requested. 
  Transaction.find({user: req.user._id, product: req.params.productId, status: "succeeded"})
  .then(transactions => {
    if(transactions.length > 0){
      console.log("user has a succeeded transaction for this product")
      // user has a succeeded transaction for this product
      Product.findById(req.params.productId)
      .populate({path: "file"})
      .then(product => {
        if(product.file != null){
          console.log("product contains a file... getting from s3")
          var getParams = {
            Bucket: product.file.bucket,
            Key: product.file.key
          }
          res.attachment(product.file.key)
          res.set("Access-Control-Expose-Headers", 'Content-Disposition')
          var fileStream = s3.getObject(getParams).createReadStream();
          fileStream.pipe(res);
        } else {
          res.status(404).send({message: 'this product does not have a file to downlaod'})
        }
      }).catch(err => {
        res.status(500).send({message: 'something went wrong looking up the product'})
      })
    } else {
      console.log("user does not have a succeeded transaction for this product")
      res.status(401).send({message: 'user has not purchased this product'})
    }
  }).catch(err => {
    res.status(500).send({message: 'something went wrong looking up the users transactions'})
  })
};
