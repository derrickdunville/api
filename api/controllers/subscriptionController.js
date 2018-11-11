let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    Subscription    = mongoose.model('Subscription'),
    User          = mongoose.model('User'),
    Product          = mongoose.model('Product'),
    waterfall     = require('async-waterfall'),
    AccessControl = require('accesscontrol'),
    stripe        = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT")



let grants = {
  admin: {
    subscription: {
      "read:any": ["*"],
      "delete:any": ["*"],
      "update:any": ["*"]
    }
  },
  everyone: {
    subscription: {
      "read:own": ['*'],
      "create:own": ['*'],
      "update:own": ['cancel_at_period_end']
    }
  }
};

let ac = new AccessControl(grants)

exports.listSubscriptions = function(req, res) {

  let readPermission = ac.can(req.user.roles).readAny('subscription')
  if(readPermission.granted){
    let query = {}
    if(req.query._id !== undefined){
      query._id = req.query._id
    }
    if(req.query.subscription !== undefined){
      query.subscription = req.query.subscription
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
    options.populate = ['user', 'product']
    // console.log("Options: " + JSON.stringify(options))

    Subscription.paginate(query, options)
    .then(subscriptions => {
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
      // console.dir(subscriptions)
      let filteredSubscriptions = readPermission.filter(JSON.parse(JSON.stringify(subscriptions.docs)))
      subscriptions.docs = filteredSubscriptions
      res.status(201).send(subscriptions);
    }).catch(err => {
      console.dir(err)
      res.status(500).send({err: err})
    })
  } else {
    res.status(401).send({err: {message: "You are not authorized to read subscriptions"}})
  }
};

exports.createSubscription = function(req, res) {

  let createPermission = ac.can(req.user.roles).createOwn("subscription")
  let readPermission = ac.can(req.user.roles).readOwn("subscription")
  if(createPermission.granted){
    // console.log("Creating subscription for " + req.user.username)
    waterfall([
      function(done){
        // Check if the user has a stripe_cus_id
        User.findOne({ token: req.user.token }, 'stripe_cus_id')
        .then(user => {
          if(user == null){
            done({res_code: 404, err: {message: "user not found"}})
          } else {
            if (user.stripe_cus_id === null){
              //create stripe customer
              // console.log("Creating stripe_cus_id for user...")
              stripe.customers.create({
                description: 'Customer for ' + req.user.email,
                email: req.user.email,
              }, function(err, customer) {
                // asynchronously called
                if (err){
                  done(err)
                } else {
                  // console.log("Stripe customer: " + JSON.stringify(customer))
                  user.stripe_cus_id = customer.id
                  user.save(function(err, updatedUser) {
                    // console.log("successfully created stripe_cus_id for user")
                    done(err, updatedUser)
                  })
                }
              })
            } else {
              // User already has stripe_cus_id
              // console.log("user already has a stripe_cus_id")
              done(null, user)
            }
          }
        }).catch(err => {
          done(err)
        })
      },
      function(user, done){
        //Check that the requested product is valid
        // console.log("User: " + JSON.stringify(user))
        // get the plan from the database
        Product.findOne({_id: req.body.product})
        .then(product => {
          if(product == null){
            done({res_code: 404, err: {message: "product not found"}})
          } else {
            done(null, user, product)
          }
        }).catch(err => {
          done(err)
        })
      },
      function(user, product, done){
        // create the subscription
        // console.log("Requested product: " + JSON.stringify(product))
        // console.log("creating stripe subscription")
        // console.log("Stripe Token: " +  JSON.stringify(req.body.stripe_token))
        // res.status(201).send({msg: "got to creating stripe subscription"})

        console.log("req.body")
        console.dir(req.body)
        // Handle updating customer default payment method
        if(req.body.stripe_source_token){
          console.log("updating stripe customer payment method")
          stripe.customers.update(req.user.stripe_cus_id, {
            source: req.body.stripe_source_token.id
          })
          .then(function(customer, err){
            if(err){
              console.log("STRIPE - ERROR")
              // console.dir(err)
              done(err)
            } else {
              console.log("STRIPE - default source updated")
              // console.dir(customer)
              //create stripe subscription
              stripe.subscriptions.create({
                customer: user.stripe_cus_id,
                items: [{ plan: product.stripe_plan_id }]
              }, function(err, stripe_subscription) {
                  // asynchronously called
                  // create new subscription record
                  if (err){
                    done(err)
                  } else {
                    console.log("Stripe Subscription: " + JSON.stringify(stripe_subscription))
                    let newSubscription = new Subscription({
                      user: user._id,
                      product: product._id,
                      subscription_id: stripe_subscription.id,
                      price: product.price,
                      total: product.price,
                      gateway: "stripe",
                      cc_last4: req.body.stripe_source_token.card.last4,
                      cc_exp_month: req.body.stripe_source_token.card.exp_month,
                      cc_exp_year: req.body.stripe_source_token.card.exp_year,
                      current_period_start: new Date(stripe_subscription.current_period_start * 1000),
                      current_period_end: new Date(stripe_subscription.current_period_end * 1000),
                      status: "active"
                    })
                    newSubscription.save()
                    .then(subscription => {
                      // console.log("Subscription created" + subscription);
                      User.findByIdAndUpdate(user._id, {$push: {subscriptions: subscription}}, {new: true}, function(errr, updatedUser){
                        if(err){
                          done(err)
                        } else {
                          // EMIT new subscription on socket
                          // need to populate the subscriptions product
                          Subscription.findOne({_id: subscription._id})
                          .populate({path: 'product'})
                          .then(populated_subscription => {
                            req.app.io.sockets.in('ADMIN').emit('SUBSCRIPTION_CREATED_EVENT', populated_subscription)
                            res.status(201).json(readPermission.filter(JSON.parse(JSON.stringify(populated_subscription))))
                          }).catch(err => {
                            done(err)
                          })
                        }
                      })
                    }).catch(err => {
                      done(err)
                    })
                  }
                }
              )
            }
          })
        } else {
          console.log("no token attached, attempting default source")
          //create stripe subscription
          // get the customers default source so we can add it to the subscriptions object
          stripe.subscriptions.create({
            customer: user.stripe_cus_id,
            items: [{ plan: product.stripe_plan_id }]
          }, function(err, stripe_subscription) {
              // asynchronously called
              // create new subscription record
              if (err){
                done(err)
              } else {
                // console.log("Stripe Subscription: " + JSON.stringify(stripe_subscription))
                let newSubscription = new Subscription({
                  user: user._id,
                  product: product._id,
                  subscription_id: stripe_subscription.id,
                  price: product.price,
                  total: product.price,
                  gateway: "stripe",
                  current_period_start: new Date(stripe_subscription.current_period_start * 1000),
                  current_period_end: new Date(stripe_subscription.current_period_end * 1000),
                  status: "active"
                })
                newSubscription.save()
                .then(subscription => {
                  // console.log("Subscription created" + subscription);
                  User.findByIdAndUpdate(user._id, {$push: {subscriptions: subscription}}, {new: true}, function(errr, updatedUser){
                    if(err){
                      done(err)
                    } else {
                      // EMIT new subscription on socket
                      // need to populate the subscriptions product
                      Subscription.findOne({_id: subscription._id})
                      .populate({path: 'product'})
                      .then(populated_subscription => {
                        req.app.io.sockets.in('ADMIN').emit('SUBSCRIPTION_CREATED_EVENT', populated_subscription)
                        res.status(201).json(readPermission.filter(JSON.parse(JSON.stringify(populated_subscription))))
                      }).catch(err => {
                        done(err)
                      })
                    }
                  })
                }).catch(err => {
                  done(err)
                })
              }
            }
          )
        }
      }
    ],
    function(err){
      if(err){
        res.status(401).send(err)
      }
    })
  } else {
    res.status(401).send({err: {message: "You are not authorized to create subscriptions"}})
  }
};

exports.readSubscription = function(req, res) {
  let readPermission = ac.can(req.user.roles).readAny('subscription');
  if(readPermission.granted){
    Subscription.findById(req.params.subscriptionId)
    .then(subscription => {
      if(subscription == null){
        res.status(404).send({err: {message: "subscription not found"}})
      } else {
        res.status(201).send(readPermission.filter(JSON.parse(JSON.stringify(subscription))))
      }
    }).catch(err => {
      console.dir(err)
      res.status(500).send({err: err})
    })
  } else {
      res.status(401).send({err: {message: "You are not authorized to read subscriptions"}})
  }
};

exports.updateSubscription = function(req, res) {

  // Check the params
  waterfall([
    function(done){
      // console.log("Updating subscription")
      if(!req.params.subscriptionId){
          res.status(400).send({err: "You must provide a subscriptionId"})
      } else {
        // Lookup the user associated to the target subscription
        Subscription.findOne({_id: req.params.subscriptionId})
        .populate('user')
        .exec(function(err, subscription) {
            if (err) {
                res.status(401).send(err)
            } else {
              // console.log("Target subscription found")
              done(err, subscription)
            }
        })
      }
    },
    function(subscription, done){
      // // Check the permission on the resource

      // console.dir(subscription)
      // console.dir(req.user)
      // First check if the current users roles can update "ANY" subscription
      let updatePermission = ac.can(req.user.roles).updateAny('subscription')
      let readPermission = ac.can(req.user.roles).readAny('subscription')
      // If not granted, check if the current role can update "OWN" subscription
      if(updatePermission.granted == false){
        // Determine if the target subscription is "owned" by the current user.
        // console.log("checking is own")
        // console.log(subscription.user._id + " == " + req.user._id)
        if(subscription.user._id.toString() == req.user._id.toString()){         // updating own
          // console.log("is own subscription")
          updatePermission = ac.can(req.user.roles).updateOwn('subscription')
          readPermission = ac.can(req.user.roles).readOwn('subscription')
        }
      }
      if(updatePermission.granted){
        // Updating subscription granted
        // console.log(req.body)
        // for subscriptions a user can only update thier own subscription and they
        // can only update the cancel_at_period_end option to ture but cannot undo it
        if(req.body.cancel_at_period_end == true){
          stripe.subscriptions.update(
             subscription.subscription_id,
             {cancel_at_period_end: true},
              function(err, confirmation) {
                if (err) {
                  // console.log("Canceling Subscription Error: " + err)
                  res.status(401).send(err)
                } else {
                  // console.log(confirmation)
                  let filteredUpdates = updatePermission.filter(req.body)
                  // console.log("Filtered subscription: " + JSON.stringify(filteredUpdates))
                  Subscription.findOneAndUpdate({_id: req.params.subscriptionId}, filteredUpdates, {new: true})
                  .then(subscription => {
                    // need to populate the subscriptions product
                    Subscription.findOne({_id: subscription._id})
                    .populate({path: 'product'})
                    .then(populated_subscription => {
                      res.status(201).json(readPermission.filter(JSON.parse(JSON.stringify(populated_subscription))))
                    }).catch(err => {
                      done(err)
                    })
                  }).catch(err => {
                    done(err)
                  })
                }
              }
            );
        } else if(req.body.cancel_at_period_end == false && subscription.cancel_at_period_end == true) {
          stripe.subscriptions.update(
             subscription.subscription_id,
             { cancel_at_period_end: false },
              function(err, confirmation) {
                if (err) {
                  // console.log("Canceling Subscription Error: " + err)
                  res.status(401).send(err)
                } else {
                  // console.log(confirmation)
                  let filteredUpdates = updatePermission.filter(req.body)
                  // console.log("Filtered subscription: " + JSON.stringify(filteredUpdates))
                  Subscription.findOneAndUpdate({_id: req.params.subscriptionId}, {cancel_at_period_end: false}, {new: true})
                  .then(subscription => {
                    // need to populate the subscriptions product
                    Subscription.findOne({_id: subscription._id})
                    .populate({path: 'product'})
                    .then(populated_subscription => {
                      res.status(201).json(readPermission.filter(JSON.parse(JSON.stringify(populated_subscription))))
                    }).catch(err => {
                      done(err)
                    })
                  }).catch(err => {
                    done(err)
                  })
                }
              }
            );
        } else {
          res.status(401).send({err: {message: "You are doing something you shouldn't!"}});
        }
      } else {
          res.status(401).send({err: {message:"You are not authorized to update subscriptions"}})
      }
    }
  ],
  function(err){
    if(err){
      res.status(401).send(err)
    }
  })
};

exports.deleteSubscription = function(req, res) {
  let deletePermission = ac.can(req.user.roles).deleteAny('subscription')
  if(deletePermission.granted){
    Subscription.findOneAndUpdate({_id: req.params.subscriptionId}, {end_date: new Date()}, {runValidators: true, context: 'query', new: true})
    .then(subscription => {
      if(subscription == null){
        res.status(404).send({err: {message: "subscription not found"}})
      } else {
        res.status(200).send();
      }
    }).catch(err => {
      console.dir(err)
      res.status(500).send({err: err})
    })
  } else {
    res.status(401).send({err: {message: "You are not authorized to delete subscriptions"}})
  }
};
