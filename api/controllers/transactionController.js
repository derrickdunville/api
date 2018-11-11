let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    jwt           = require('jsonwebtoken'),
    ejwt          = require('express-jwt'),
    Transaction    = mongoose.model('Transaction'),
    User          = mongoose.model('User'),
    waterfall     = require('async-waterfall'),
    AccessControl = require('accesscontrol'),
    stripe        = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT");


let grants = {
  admin: {
    transaction: {
      "read:any": ["*"],
      "create:any": ["*"],
      "delete:any": ["*"],
      "update:any": ["status"]
    }
  },
  everyone: {
    transaction: {
      "create:own": ["*"],
      "read:own":["*"]
    }
  }
}

let ac = new AccessControl(grants)

exports.listTransactions = function(req, res) {
    // console.log("User Roles: " + req.user.roles);

    let readPermission = ac.can(req.user.roles).readAny('transaction')
    if(readPermission.granted){
      let query = {}

      if(req.query._id !== undefined){
        query._id = req.query._id
      }
      if(req.query.trans_num !== undefined){
        query.amount = req.query.trans_num
      }
      if(req.query.amount !== undefined){
        query.amount = req.query.amount
      }
      if(req.query.amount !== undefined){
        query.amount = req.query.amount
      }
      if(req.query.total !== undefined){
        query.amount = req.query.total
      }
      if(req.query.user !== undefined){
        query.amount = req.query.user
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
      //
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
      options.populate = ['user', 'product']
      // console.log("Options: " + JSON.stringify(options))

      Transaction.paginate(query,  options)
      .then(transactions => {
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
        let filteredTransactions = readPermission.filter(JSON.parse(JSON.stringify(transactions.docs)))
        transactions.docs = filteredTransactions
        res.status(201).send(transactions)
      }).catch(err => {
        res.status(500).send({err: err})
      })
    } else {
      res.status(401).send({err: {message: "You are not authorized to read transactions"}});
    }
};

exports.createTransaction = function(req, res) {

  /* Scenarios:
  *   1) Transactions is being created by an admin for someone else
  *       - If transaction has an amount > 0
  *   2) Transaction is being created by a user for themselves
  */
  // Users can only create transactions for themselves for non-subscription products
  // they only need to send the list of product ids.
  let requestedProduct = req.body.product
  // console.log('requested product id: ' + requestedProduct)
  // how to tell if the transation is by an Admin or everyone
  if(req.user.roles.includes('admin') &&
      req.body.hasOwnProperty('user') &&
      req.body.user != req.user._id){
    // if the user is an admin and the user property doesn not equal the admins user._id,
    // they must be creating for someone else
    // console.log('user is an admin creating for someone else')
    let createPermission = ac.can(req.user.roles).createAny("transaction")
    let readPermission = ac.can(req.user.roles).readAny("transaction")
    if(createPermission.granted){
      waterfall([
        function(done){
          // check if the user id exists
          User.findOne({_id: req.body.user})
          .then(user => {
            if(user != null){
              done(null, user)
            } else {
              done({res_code: 400, err: {message:"invalid user id"}})
            }
          }).catch(err => {
            done(err)
          })
        },
        function(user, done){
          // chek if the product id exists
          Product.findOne({_id: req.body.product})
          .then(product => {
            if(product != null){
              done(null, user, product)
            } else {
              done({res_code: 400, err: {message: "invalid product id"}})
            }
          }).catch(err => {
            done(err)
          })
        },
        function(user, product, done){
          let newTransaction = new Transaction(createPermission.filter(req.body));
          newTransaction.save()
          .then(transaction => {
            // push the new transaction onto the users transaction list
            User.findByIdAndUpdate(transaction.user, {$push: {transactions: transaction}}, {new: true}, function(err, user){
              if(err){
                done(err)
              } else {
                // console.dir(transaction)
                req.app.io.sockets.in('ADMIN').emit('TRANSACTION_CREATED', transaction)
                req.app.io.sockets.in(user._id).emit('ME_UPDATED', user)
                res.status(201).json(readPermission.filter(JSON.parse(JSON.stringify(transaction))))
              }
            })
          }).catch(err => {
            // console.log("Error creating transaction!");
            done(err)
          })
        }],
        function(err){
          if(err.hasOwnProperty('res_code')){
            res.status(err.res_code).send({err: err.err})
          } else {
            // console.dir(err)
            res.status(500).send({err: err})
          }
        })
    } else {
      res.status(401).send({err: {message: "You are not authorized to create transactions"}})
    }
  } else {
    // if the user is not an admin, they musr be creating for themself
    // console.log('user is not an admin')
    let createPermission = ac.can(req.user.roles).createOwn("transaction")
    let readPermission = ac.can(req.user.roles).readOwn("transaction")
    if(createPermission.granted){
      waterfall([
        function(done){
          // verify the product id
          Product.findOne({_id: requestedProduct})
          .then(product => {
            if(product == null){
              done({ message: 'product id not found' })
            } else {
              // console.log("product found... next")
              // console.dir(product)
              done(null, product)
            }
          }).catch(err => {
            // console.log("error looking up product")
            done(err)
          })
        },
        function(product, done){
          // validate that the user can purchase this product
          // if the user has a paid transaction containing the requested product._id
          // then they can NOT purchase this product again
          Transaction.find({user: req.user._id, product: product._id, status: "succeeded"})
          .populate({
            path: 'product',
            match: { interval: 'one-time' }
          })
          .then(async (transactions) => {
            if(transactions.length > 0){
              // console.log("transaction: " + transactions.length)
              // console.dir(JSON.parse(JSON.stringify(transactions)))
              console.log("looks like this user has already purchased this one-time product")
              res.status(403).send({err: {message: "user has already purchased this product"}})
            } else {
              // the user has not purchased the requested product and we are ok
              // to create the new transactions
              let newTransaction = new Transaction({
                user: req.user._id,
                product: product._id,
                amount: product.amount,
                total: product.amount
              })

              // STRIPE:
              // Was the user referred by another user?
              // Check if the user has a stripe_cus_id
              // if not create one for them
              let charge = await stripe.charges.create({
                customer: req.user.stripe_cus_id,
                amount: product.amount,
                currency: 'usd',
                description: 'Charge for ' + product.name,
                metadata: {
                  product_id: product._id.toString(),
                  product_name: product.name
                }
              })
              // might need to error check the charge here
              // console.dir(charge)
              newTransaction.trans_num = charge.id
              newTransaction.status = charge.status
              newTransaction.gateway = "stripe"
              newTransaction.save()
              .then(transaction => {
                console.log("transaction created: ")
                console.dir(JSON.parse(JSON.stringify(transaction)))
                User.findByIdAndUpdate(transaction.user, {$push: {transactions: transaction}}, {new: true})
                .then(user => {
                  Transaction.findById({_id: transaction._id})
                  .populate({path: 'user'})
                  .populate({path: 'product'})
                  .then(transaction => {
                    console.dir(JSON.parse(JSON.stringify(transaction)))
                    req.app.io.sockets.in('ADMIN').emit('TRANSACTION_CREATED_EVENT', transaction)
                    req.app.io.sockets.in(transaction.user._id).emit('ME_UPDATED', transaction.user)
                    res.status(201).send(readPermission.filter(JSON.parse(JSON.stringify(transaction))))
                  }).catch(err => {
                    console.log("something went wrong creating the transaction")
                    done(err)
                  })
                }).catch(err => {
                  console.log("sonething went wrong pushing the transaction onto the user")
                  done(err)
                })
              }).catch(err => {
                console.log("something went wrong creating the transaction")
                done(err)
              })
            }
          }).catch(err => {
            console.log("error looking up user transactions", err)
            done(err)
          })
        }],
        function(err){
          // console.dir(err)
          res.status(500).send({err: err})
        })
    } else {
      res.status(401).send({err: {message: "You are not authorized to create transactions"}})
    }
  }
};

exports.readTransaction = function(req, res) {

  // // Check the permission on the resource
  let readPermission = ac.can(req.user.roles).readAny('transaction');
  if(readPermission.granted){
    Transaction.findById({_id: req.params.transactionId})
    .populate({path: 'user'})
    .populate({path: 'product'})
    .then(transaction => {
      if(transaction == null){
        res.status(404).send({err: {message: "transaction not found"}})
      } else {
        res.status(201).json(readPermission.filter(JSON.parse(JSON.stringify(transaction))))
      }
    }).catch(err => {
      console.dir(err)
      res.status(500).send({err: err})
    })
  } else {
    res.status(401).send({err: {message: "You are not authorized to read transactions"}});
  }
};

// Only ADMIN role is allowed to update transactions
// For now the only update allowed is setting the status to refunded
exports.updateTransaction = function(req, res) {

  // // Check the permission on the resource
  let updatePermission = ac.can(req.user.roles).updateAny('transaction')
  let readPermission = ac.can(req.user.roles).readAny('transaction')
  if(updatePermission.granted){

    // REFUNDS
    // When a transaction moves from a status of succeeded/pending to refunded,
    // a refund needs to be issued at the gateway, the transaction needs to be
    // updated to a status of 'refunded' and the refund_amount needs to be set.

    waterfall([
      function(done){
        Transaction.findById(req.params.transactionId)
        .then(transaction => {
          if(transaction == null){
            done({err: {message: "transaction not found"}})
          } else {
            done(null, transaction)
          }
        }).catch(err => {
          done(err)
        })
      },
      function(transaction, done){
        // Check if the transaction is being refunded
        if((transaction.status == 'succeeded' || transaction.status == 'pending') && req.body.status == 'refunded'){
          // Issue a refund on the gateway
          if(transaction.gateway === 'stripe'){
            stripe.refunds.create({
              charge: transaction.trans_num
            }, function(err, refund) {
              if (err)
                res.status(401).send(err)
              // console.log("Stripe: Transaction refunded successfully")
              transaction.status = 'refunded'
              transaction.amount_refunded = refund.amount
              transaction.refunded_at = Date.now()
              // transaction.save(function(err, transaction){
              //   let filteredTransaction = readPermission.filter(JSON.parse(JSON.stringify(transaction)))
              //   req.app.io.sockets.in('ADMIN').emit('TRANSACTION_UPDATED', filteredTransaction)
              //   res.status(201).json(filteredTransaction)
              // });
              Transaction.findOneAndUpdate({_id: transaction._id}, transaction, {runValidators: true, context: 'query', new: true})
              .populate({path: 'product'})
              .populate({path: 'user'})
              .then(transaction => {
                let filteredTransaction = readPermission.filter(JSON.parse(JSON.stringify(transaction)))
                // Let the owning user know about the updates
                // req.app.io.sockets.in(transaction.user._id.toString()).emit('TRANSACTION_UPDATED', filteredTransaction)
                // Let the admin user know about the updates
                req.app.io.sockets.in('ADMIN').emit('TRANSACTION_UPDATED', filteredTransaction)
                req.app.io.sockets.in(transaction.user._id).emit('ME_UPDATED', transaction.user)
                res.status(201).send(filteredTransaction);
              }).catch(err => {
                done(err)
              })
            });
          // Handle other gateways here...
          } else {
            console.log("Not Stripe Gateway: TODO")
            res.status(400).json({ err: "Unhandled gateway type" })
          }
        // Something else was updated
        } else {
          console.log("Something else was updated")
          res.status(400).json({ err: "Need to implement transaction updates" })
        }
      }],
      function(err){
        if(err){
          console.dir(err)
          res.status(500).send({err: err})
        }
      })
  } else {
    res.status(401).send({err: {message: "You are not authorized to update transactions"}});
  }
};

exports.deleteTransaction = function(req, res) {
  let deletePermission = ac.can(req.user.roles).deleteAny('transaction')
  if(deletePermission.granted){
    Transaction.findOneAndUpdate({_id: req.params.transactionId},{end_date: new Date()}, {new: true})
    .then(transaction => {
      if(transaction == null){
        res.status(404).send({err: {message: "transaction not found"}})
      } else {
        req.app.io.sockets.in('ADMIN').emit('TRANSACTION_CREATED', transaction)
        req.app.io.sockets.in(user._id).emit('ME_UPDATED', user)
        res.status(200).send({message: "transaction successfully end dated"})
      }
    }).catch(err => {
      res.status(500).send({err: err})
    })
  } else {
    res.status(401).send({err: {message: "You are not authorized to delete transactions"}})
  }
}
