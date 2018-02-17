let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    jwt           = require('jsonwebtoken'),
    ejwt          = require('express-jwt'),
    Subscription    = mongoose.model('Subscription'),
    User          = mongoose.model('User'),
    Product          = mongoose.model('Product'),
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
  console.log("Creating " + req.body.product.name + " subscription for " + req.user.username)
  waterfall([
    function(done){
      // Check if the user has a stripe_cus_id
      User.findOne({ token: req.user.token }, 'stripe_cus_id', function(err, user) {
        if (err) {
            res.status(401).send(err)
        } else {
          if (user.stripe_cus_id === null){
            //create stripe customer
            console.log("Creating stripe_cus_id for user...")
            stripe.customers.create({
              description: 'Customer for ' + req.user.email,
              email: req.user.email,
            }, function(err, customer) {
              // asynchronously called
              if (err){
                res.status(401).send(err)
              } else {
                console.log("Stripe customer: " + JSON.stringify(customer))
                user.stripe_cus_id = customer.id
                user.save(function(err, updatedUser) {
                  console.log("successfully created stripe_cus_id for user")
                  done(err, updatedUser)
                  // res.status(201).send({msg: "successfully created subscription"})
                })
              }
            })
          } else {
            // User already has stripe_cus_id
            done(err, user)
          }
        }
      });
    },
    function(user, done){
      //Check that the requested product is valid
      console.log("User: " + JSON.stringify(user))
      // get the plan from the database
      Product.findOne({_id: req.body.product._id}, function(err, product) {
        if (err) {
          res.status(401).send(err)
        } else {
          // console.log("Requested product: " + JSON.stringify(product))
          done(err, user, product)
        }
      })
    },
    function(user, product, done){
      // create the subscription
      console.log("Requested product: " + JSON.stringify(product))
      console.log("creating stripe subscription")
      console.log("Stripe Token: " +  JSON.stringify(req.body.stripe_token))
      // res.status(201).send({msg: "got to creating stripe subscription"})
      //create stripe subscription
      stripe.subscriptions.create({
        customer: user.stripe_cus_id,
        items: [{ plan: product.stripe_plan_id }],
        source: req.body.stripe_token.id // obtained with Stripe.js - updates the cus default card
      }, function(err, stripe_subscription) {
          // asynchronously called
          // create new subscription record
          if (err){
            res.status(401).send(err)
          } else {
            console.log("Stripe Subscription: " + JSON.stringify(stripe_subscription))
            let newSubscription = new Subscription({
              user_id: user._id,
              product_id: product._id,
              subscription_id: stripe_subscription.id,
              price: product.price,
              total: product.price,
              gateway: "stripe",
              cc_last4: req.body.stripe_token.card.last4,
              cc_exp_month: req.body.stripe_token.card.exp_month,
              cc_exp_year: req.body.stripe_token.card.exp_year,
              status: "active"
            })
            newSubscription.save(function (err, subscription) {
                if (err) {
                    // console.log("Error creating subscription!");
                    res.status(401).send(err)
                } else {
                    // console.log("Subscription created" + subscription);
                    User.findByIdAndUpdate(user._id, {$push: {subscriptions: subscription}}, {new: true}, function(errr, updatedUser){
                      if(err){
                        res.status(401).send(err)
                      } else {
                        res.status(201).json(updatedUser)
                      }
                    })
                }
            });
          }
        }
      )
    }
  ],
  function(err){
    if(err){
      res.status(401).send(err)
    }
  })
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
