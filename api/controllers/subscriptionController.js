let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    jwt           = require('jsonwebtoken'),
    ejwt          = require('express-jwt'),
    Subscription    = mongoose.model('Subscription'),
    User          = mongoose.model('User'),
    waterfall     = require('async-waterfall'),
    AccessControl = require('accesscontrol'),
    stripe        = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT")


//
// let grants = {
//     admin: {
//         subscription: {
//             "read:any": ["*"],
//             "delete:any": ["*"],
//             "update:any": ["*"]
//         }
//     },
//     everyone: {
//         subscription: {
//             "read:any": ['*', '!password', '!token', '!email'],
//             "delete:own": ['*'],
//             "update:own": ['*']
//         }
//     }
// };

exports.listSubscriptions = function(req, res) {
  // console.log("User Roles: " + req.user.roles);
  // let permission = ac.can(req.user.roles).readAny('subscription');
  // if(permission.granted){
  Subscription.find({}, function(err, subscriptions) {
      if (err)
          res.status(401).send(err)
      // filter the result set
      // let filteredSubscriptions = permission.filter(JSON.parse(JSON.stringify(subscriptions)));
      // console.log('Filtered User List: ' + filteredUsers);
      res.status(201).send(subscriptions)
  });
  // } else {
  //     res.status(400).send({err: "You are not authorized to view all subscriptions"});
  // }
};

exports.createSubscription = function(req, res) {

  // req should contain {
  //  token: "userapitoken",
  //  gateway: "stripe",
  //  product_id: "872984795903284"
  // }:
  // if gateway is stripe
  //  check if the user has a stripe customer id
  //  if not make one then proceed.
  //

  User.findOne({ token: req.body.token }, 'stripe_cus_id', function(err, user) {
      if (err) {
          res.status(401).send(err)
      } else {
        console.log(user)
        if (user.stripe_cus_id === null){
          //create stripe customer

        }
      }
  });

  // console.log("Creating subscription...");
  // console.log("Request Body: " + req.body);
  // if(!req.body.username || !req.body.password || !req.body.email) {
  //     res.status(400).send({err: "Must provide username, password, and email"});
  // } else {

  // Error check the request body
  // let newSubscription = new Subscription(req.body);

  // stripe.subscriptions.create({
  //   customer: "cus_AWzAeze04M1yMf",
  //   items: [{ plan: "plan_CDBedvN0L6RBpL" }]
  // }, function(err, subscription) {
  //     // asynchronously called
  //   }
  // );
  //
  newSubscription.save(function (err, subscription) {
      if (err) {
          // console.log("Error creating subscription!");
          res.status(401).send(err)
      } else {
          // console.log("Subscription created" + subscription);
          res.status(201).json(subscription)
      }
  });
  // }
};

exports.readSubscription = function(req, res) {
  // Check the params
  // if(!req.params.subscriptionId){
  //     res.status(400).send({err: "You must provide a subscriptionId"});
  // }
  // // Check the permission on the resource
  // let permission = ac.can('everyone').readAny('subscription');
  // if(permission.granted){
  Subscription.findById(req.params.subscriptionId, function(err, subscription) {
      if (err)
          res.status(401).send(err)
          // Todo: Filter the memebership object
      res.status(201).json(subscription)
  });
  // } else {
  //     res.status(401).send({err: "Unauthorized"});
  // }
};

exports.updateSubscription = function(req, res) {

  // // Check the params
  // if(!req.params.subscriptionId){
  //     res.status(400).send({err: "You must provide a subscriptionId"});
  // }
  // // Check the permission on the resource
  // let permission = ac.can(req.session.user.roles).updateOwn('subscription');
  // if(permission.granted){
  Subscription.findOneAndUpdate(req.params.subscriptionId, req.body, {new: true}, function(err, subscription) {
      if (err)
          res.status(401).send(err)
      res.status(201).json(subscription)
  });
  // } else {
  //     res.status(400).send({err: "You are not authorized to update subscriptions"});
  // }
};

exports.deleteSubscription = function(req, res) {
  Subscription.findOneAndUpdate(req.params.subscriptionId, {end_date: new Date()}, {new: true}, function(err, subscription) {
      if (err)
          res.status(401).send(err)
      res.status(201).json({message: 'subscription successfully end dated'})
  })
}
