let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    jwt           = require('jsonwebtoken'),
    ejwt          = require('express-jwt'),
    Transaction    = mongoose.model('Transaction'),
    waterfall     = require('async-waterfall'),
    AccessControl = require('accesscontrol');

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
  // let permission = ac.can(req.user.roles).readAny('transaction');
  // if(permission.granted){
  Transaction.find({}, function(err, transactions) {
      if (err)
          res.status(401).send(err)
      // filter the result set
      // let filteredTransactions = permission.filter(JSON.parse(JSON.stringify(transactions)));
      // console.log('Filtered User List: ' + filteredUsers);
      res.status(201).send(transactions)
  });
  // } else {
  //     res.status(400).send({err: "You are not authorized to view all transactions"});
  // }
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
          res.status(201).json(transaction)
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

exports.updateTransaction = function(req, res) {

  // // Check the params
  // if(!req.params.transactionId){
  //     res.status(400).send({err: "You must provide a transactionId"});
  // }
  // // Check the permission on the resource
  // let permission = ac.can(req.session.user.roles).updateOwn('transaction');
  // if(permission.granted){
  Transaction.findOneAndUpdate(req.params.transactionId, req.body, {new: true}, function(err, transaction) {
      if (err)
          res.status(401).send(err)
      res.status(201).json(transaction)
  });
  // } else {
  //     res.status(400).send({err: "You are not authorized to update transactions"});
  // }
};

exports.deleteTransaction = function(req, res) {
  Transaction.findOneAndUpdate(req.params.transactionId, {end_date: new Date()}, {new: true}, function(err, transaction) {
      if (err)
          res.status(401).send(err)
      res.status(201).json({message: 'transaction successfully end dated'})
  })
}
