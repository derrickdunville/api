let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    jwt           = require('jsonwebtoken'),
    ejwt          = require('express-jwt'),
    Transaction    = mongoose.model('Transaction'),
    waterfall     = require('async-waterfall'),
    AccessControl = require('accesscontrol'),
    stripe        = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT");

//
// let grants = {
//     admin: {
//         transaction: {
//             "read:any": ["*"],
//             "delete:any": ["*"],
//             "update:any": ["*"]
//         }
//     },
//     everyone: {
//         transaction: {
//             "read:any": ['*', '!password', '!token', '!email'],
//             "delete:own": ['*'],
//             "update:own": ['*']
//         }
//     }
// };

exports.listTransactions = function(req, res) {
    // console.log("User Roles: " + req.user.roles);

    let query = {}
    if(req.query._id !== undefined){
      query.name = {'$regex': req.query._id, '$options': 'i'}
    }

    console.log("Query: " + JSON.stringify(query))

    let options = {}
    if (req.query.page === undefined) {
      options.page = 1
    } else {
      options.page = parseInt(req.query.page)
    }
    console.log("Options: " + JSON.stringify(options))

    // let permission = ac.can(req.user.roles).readAny('user');
    // if(permission.granted){

    // } else {
    //     res.status(400).send({err: "You are not authorized to view all users"});
    // }

    Transaction.paginate(query, { page: options.page, limit: 25 }, function(err, transactions) {
      if(err){
        res.status(401).send('Error getting transactions')
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
        console.dir("transactions: " + JSON.stringify(transactions))
        res.status(201).send(transactions);

      }
    });
};

exports.createTransaction = function(req, res) {

  // Only admin should be allowed to create transactions
  // console.log("Creating transaction...");
  // console.log("Request Body: " + req.body);
  // if(!req.body.username || !req.body.password || !req.body.email) {
  //     res.status(400).send({err: "Must provide username, password, and email"});
  // } else {

  // Error check the request body
  let newTransaction = new Transaction(req.body);
  newTransaction.save(function (err, transaction) {
      if (err) {
        // console.log("Error creating transaction!");
        res.status(401).send(err)
      } else {
          // console.log("Transaction created" + transaction);
          // Push the new transaction onto the users transaction list
        transaction.user.transactions.push(transaction._id)
        transaction.user.save(function (err, user) {
          if(err){
            res.status(401).send(err)
          } else {
            res.status(201).json(transaction)
          }
        });
      }
  });
  // }
};

exports.readTransaction = function(req, res) {
  // Check the params
  // if(!req.params.transactionId){
  //     res.status(400).send({err: "You must provide a transactionId"});
  // }
  // // Check the permission on the resource
  // let permission = ac.can('everyone').readAny('transaction');
  // if(permission.granted){
  Transaction.findById(req.params.transactionId, function(err, transaction) {
      if (err)
          res.status(401).send(err)
          // Todo: Filter the memebership object
      res.status(201).json(transaction)
  });
  // } else {
  //     res.status(401).send({err: "Unauthorized"});
  // }
};

// Only ADMIN role is allowed to update transactions
exports.updateTransaction = function(req, res) {

  // // Check the params
  if(!req.params.transactionId){
      res.status(400).send({err: "You must provide a transactionId"});
      return
  }
  // // Check the permission on the resource
  // let permission = ac.can(req.session.user.roles).updateAny('transaction');
  // if(permission.granted){


  // REFUNDS
  // When a transaction moves from a status of succeeded to refunded,
  // a refund needs to be issues at the gateway, the transaction needs to be
  // updated to a status of 'refunded' and the refund_amount needs to be set.

  waterfall([
    function(done){
      Transaction.findById(req.params.transactionId, function(err, transaction) {
          if (err)
              res.status(401).send(err)
          done(err, transaction)
      });
    },
    function(transaction, done){
      // Check if the transaction is being refunded
      if(transaction.status === 'succeeded' && req.body.transaction.status === 'refunded'){
        // Issue a refund on the gateway
        if(transaction.gateway === 'stripe'){
          stripe.refunds.create({
            charge: transaction.trans_num
          }, function(err, refund) {
            if (err)
              res.status(401).send(err)
            console.log("Stripe: Transaction refunded successfully")
            transaction.status = 'refunded'
            transaction.amount_refunded = refund.amount
            transaction.refunded_at = Date.now()
            transaction.save(function(err, transaction){
              res.status(201).json({ transaction: transaction })
            });
          });
        // Handle other gateways here...
        } else {
          console.log("Not Stripe Gateway: TODO")
          res.status(401).json({ err: "Unhandled gateway type" })
        }
      // Something else was updated
      } else {
        console.log("Something else was updated")
        res.status(401).json({ err: "Need to implement transaction updates" })
      }
    }],
    function(err){
      if(err){
        res.status(401).send(err)
      }
    })

};

exports.deleteTransaction = function(req, res) {
  Transaction.findOneAndUpdate(req.params.transactionId, {end_date: new Date()}, {new: true}, function(err, transaction) {
      if (err)
          res.status(401).send(err)
      res.status(201).json({message: 'transaction successfully end dated'})
  })
}
