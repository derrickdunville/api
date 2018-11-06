let mongoose      = require('mongoose'),
    mongodb       = require('mongodb'),
    config        = require('../config'),
    _             = require('lodash'),
    jwt           = require('jsonwebtoken'),
    ejwt          = require('express-jwt'),
    waterfall     = require('async-waterfall'),
    AccessControl = require('accesscontrol'),
    stripe        = require('stripe')("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT"),
    User          = mongoose.model('User')
    Transaction   = mongoose.model('Transaction')
    Subscription  = mongoose.model('Subscription')
    Product       = mongoose.model('Product')
    Commission    = mongoose.model('Commission')

customerSubscriptionCreated = function(req, res) {
  // console.log(JSON.stringify(req.body.data.object))
  res.status(200).send()
}
customerSubscriptionDeleted = function(req, res) {
  // console.log(JSON.stringify(req.body.data.object))
  stripe_subscription = req.body.data.object
  if(stripe_subscription.status === "canceled"){
    // if status is set to canceled, the subscription is cancelled immediatly
    Subscription.findOneAndUpdate(
      { subscription_id: stripe_subscription.id },
      { end_date: Date.now(), status: "canceled" },
      { new: true },
      function(err, subscription) {
        if (err) {
          // console.log("STRIPE WEBHOOK EVENT ERROR: customer.subscription.deleted error occurred: \n" + err)
          res.status(200).send()
        }
        //TODO: send webhook event to admin and owner of subscription
        // req.app.io.sockets.emit('auth-updated', '')
        res.status(200).send()
    })
  } else {
    // if cancel_at_period_end is set to true, the subscription is cancelled at_period_end
    Subscription.findOneAndUpdate(
      { subscription_id: stripe_subscription.id },
      { cancel_at_period_end: true },
      { new: true },
      function(err, subscription) {
        if (err){
          // console.log("STRIPE WEBHOOK EVENT ERROR: customer.subscription.deleted error occurred: \n" + err)
          res.status(200).send()
        }
        //TODO: send webhook event to admin and owner of subscription
        // req.app.io.sockets.emit('auth-updated', '')
        res.status(200).send()
    })
  }
}
customerSubscriptionTrialWillEnd = function(req, res) {
  // console.log(JSON.stringify(req.body.data.object))
  res.status(200).send()
}
customerSubscriptionUpdated = function(req, res) {
  // console.log(JSON.stringify(req.body.data.object))
  stripe_subscription = req.body.data.object

  // if the stripe_subscription has cancel_at_period_end and has canceled_at date set
  if(stripe_subscription.cancel_at_period_end && stripe_subscription.canceled_at !== null){
    Subscription.findOneAndUpdate(
      { subscription_id: stripe_subscription.id },
      { cancel_at_period_end: true },
      { new: true },
      function(err, subscription) {
        if (err){
          // console.log("STRIPE WEBHOOK EVENT ERROR: customer.subscription.deleted error occurred: \n" + err)
          res.status(200).send()
        }
        //TODO: send webhook event to admin and owner of subscription
        // req.app.io.sockets.emit('auth-updated', '')
        res.status(200).send()
    })
  } else {

    //Update other subscription stuff here
    res.status(200).send()
  }
}

invoiceCreated = function(req, res) {
  // console.log("invoice.created")
  waterfall([
    function(done){
      //  use the stripe customer to look up the corresponding user
      // console.log("Looking up user by customer: " + req.body.data.object.customer)
      User.findOne({ stripe_cus_id: req.body.data.object.customer }, function(err, user) {
        if (err || user == null) {
          // console.log("STRIPE WEBHOOK EVENT ERROR: invoice.created error occurred: \n" + err)
          res.status(200).send()
        } else {
          // console.log("User Found")
          done(err, user)
        }
      });
    },
    function(user, done){
      //  if the invoice is for a subscription look up the corresponding subscription
      if(req.body.data.object.subscription !== null){
        Subscription.findOne({subscription_id: req.body.data.object.subscription}, function(err, subscription) {
          if (err) {
            // console.log("STRIPE WEBHOOK EVENT ERROR: invoice.created error occurred: \n" + err)
            res.status(401).send(err)
          } else {
            // console.log("Subscription Found")
            done(err, user, subscription)
          }
        })
      } else {
        // console.log("No Subscription on Invoice")
        done(err, user, null)
      }
    },
    function(user, subscription, done){
      // create the transaction
      // console.log("creating stripe transaction")
      //check if the transaction exists
      Transaction.findOne({ trans_num: req.body.data.object.charge }, function(err, transaction) {
        if (err) {
          // console.log("Error looking up transaction: " + err);
          res.status(401).send(err)
        } else if (!transaction){
          // console.log("Transaction does not exist - Creating...")
          stripe.charges.retrieve(req.body.data.object.charge, function(err, charge) {
            if (err) {
              // console.log("Error looking up stripe charge: " + err);
              res.status(401).send(err);
            } else {
              let invoice = req.body.data.object
              let newTransaction = new Transaction({
                user: user._id,
                subscription: subscription._id,
                trans_num: invoice.charge,
                amount: invoice.subtotal,
                total: invoice.total,
                gateway: "stripe",
                status: charge.status,
                product: subscription.product,
                expires_at: new Date(invoice.period_end*1000)
              })
              newTransaction.save(function (err, transaction) {
                if (err) {
                    // console.log("Saving newTransaction error: " + err);
                    res.status(401).send(err);
                } else {
                    // console.log("Transaction created");
                    // console.dir(user)
                    if(user.referred_by != null){
                      // console.log("Transaction was referred by: " + user.referred_by + " creating new commision")
                      let newCommission = new Commission({
                        user: user.referred_by, // referring users id
                        transaction: transaction._id,
                        rate: 10,
                        total: Math.floor(transaction.amount*(10/100)), //amount is in pennies
                        corrected_total: 0
                      })
                      newCommission.save(function (err, commission) {
                        if(err){
                          // console.log("Saving newCommission error: " + err)
                          res.status(401).send(err)
                        } else {
                          // console.log("newCommission saved")
                          // console.dir(commission)
                        }
                      })
                    } else {
                      // console.log("Transaction was not referred")
                    }
                    // console.log("Subscription created" + subscription);
                    User.findByIdAndUpdate(user._id, {$push: {transactions: transaction}}, {new: true}, function(err, updatedUser){
                      if(err){
                        res.status(401).send(err)
                      } else {
                        // req.app.io.sockets.emit('auth-updated', updatedUser)
                        res.status(200).send();
                      }
                    })
                    // Send them a new transaction email here
                }
              })
            }
          })
        } else {
          // User found
          // console.log("Transaction Found - Updating...")
          done(err)
        }
      });
    }
  ],
  function(err){
    if(err){
      // console.log("err: " + err)
      res.status(401).send(err)
    }
  })
  // create a new transaction for the user
}
invoicePaymentFailed = function(req, res) {
  // console.log("invoice.payment_failed")
  // console.log(JSON.stringify(req.body.data.object))
  res.status(200).send()
}
invoicePaymentSucceeded = function(req, res) {
  // console.log("invoice.payment_succeeded")

  // This timeout is used to make sure we get the invoice.created webhook to
  // make sure the transaction that is updated by invoice.payment_succeeded exists
  setTimeout(function(){
    // console.log("waiting for 2 seconds")

    // DETAILS:
    // we only need to listen for webhook events for invoices that are for subscriptions
    // any invoice recieved from stripe will only contain one subscription for on product.
    // products with a plan vs product will be on seperate invoices always
    //
    // for subscription ivoices we need to get the billing period end from the subscription
    // on the invoice to use as the expires_at field on the transaction.
    //
    //  use the stripe customer to look up the corresponding user
    //  if the invoice is for a subscription look up the corresponding subscription
    if(req.body.data.object.subscription){
      // console.log("invoice is for a subscription")
      waterfall([
        function(done){
          //  use the stripe customer to look up the corresponding user
          // console.log("Looking up user by customer: " + req.body.data.object.customer)
          User.findOne({ stripe_cus_id: req.body.data.object.customer }, function(err, user) {
            if (err) {
              // console.log("STRIPE WEBHOOK EVENT ERROR: invoice.payment_succeeded error occurred: \n" + err)
              done(err)
            } else {
              // console.log("User Found")
              done(err, user)
            }
          });
        },
        function(user, done){
          // now use the charge id to lookup the transaction
          // if it doesnt exist create it
          Transaction.findOne({trans_num: req.body.data.object.charge}, function(err, transaction) {
            if(err){
              done(err)
            } else if (!transaction){
              // console.log("Transaction not found.. letting the webhook retry later")
              res.status(300).send()
            } else {
              // console.log("Transaction Found")
              done(err, user, transaction)
            }
          })
        },
        function(user, transaction, done){
          stripe.subscriptions.retrieve(
            req.body.data.object.subscription,
            function(err, subscription){
              if(err){
                // console.dir(err)
                done(err)
              } else {
                // console.dir(subscription)
                done(err, user, transaction, subscription)
              }
            }
          )
        },
        function(user, transaction, subscription, done){
          // update the transaction
          Transaction.findOne({_id: transaction._id}, function(err, transaction) {
            if(err){
              done(err)
            } else {
              transaction.expires_at = new Date(subscription.current_period_end*1000)
              transaction.status = 'succeeded'
              transaction.save(function(err, transaction){
                if(err){
                  // console.log("error saving updated transaction: " + err)
                  done(err)
                } else {
                  // console.log("updated transaction saved")
                  res.status(200).send()
                }
              })
            }
          })
        }
        ],
        function(err){
            // console.log("error occurred")
            res.status(200).send()
        })
    } else {
      // console.log("invoice.payment_succeeded for non subscription invoice")
      res.status(200).send()
    }

  }, 2000)
  // console.log(JSON.stringify(req.body.data.object))

}
invoiceSent = function(req, res) {
  // console.log(JSON.stringify(req.body.data.object))
  res.status(200).send()
}
invoiceUpcoming = function(req, res){
  // console.log(JSON.stringify(req.body.data.object))
  res.status(200).send()
}
invoiceUpdated = function(req, res){
  // console.log(JSON.stringify(req.body.data.object))
  res.status(200).send()
}


// charge.succeeded occurs whenever a new charge is created and is successful
// for subscriptions we need to catch this to create the transaction records
// that correspond to a subscription initiated charges
chargeSucceeded = function(req, res) {
  // console.log("charge.succeeded")
  // // we can check the invoice on the charge to check if the charge was generated by
  // // a subscription.
  // waterfall([
  //   function(done){
  //     User.findOne({stripe_cus_id: req.body.data.object.customer}, function(err, user){
  //       if(err) {
  //         done(err)
  //       } else if(!user) {
  //         let err = "no user exists with stripe_cus_id: " + req.body.data.object.customer
  //         done(err)
  //       } else {
  //         done(user)
  //       }
  //     })
  //   },
  //   function(user, done){
  //     let charge = req.body.data.object
  //     // get the invoice from stripe
  //     stripe.invoices.retrieve(
  //       charge.invoice,
  //       function(err, invoice){
  //         if(err){
  //           console.log("error retrieving invoice from stripe")
  //           done(err)
  //         } else {
  //           console.log("retrieved invoice from stripe")
  //           done(user, invoice)
  //         }
  //       }
  //     )
  //   },
  //   function(user, invoice, done){
  //     if(invoice.subscription){
  //       stripe.subscriptions.retrieve(
  //         invoice.subscription,
  //         function(err, subscription){
  //           if(err){
  //             console.log("error retrieving subscription from stripe")
  //             done(err)
  //           } else {
  //             console.log("retrieved subscription from stripe")
  //             done(user, invoice, subscription)
  //           }
  //         }
  //       )
  //     } else {
  //       console.log("invoice is not for a subscription")
  //       res.status(200).send()
  //     }
  //   }
  //   function(user, invoice, subscription, done){
  //
  //   }
  // ],
  // function(err){
  //   console.log("something went wrong charge.succeeded: " + err)
  //   res.status(200).send()
  // })
res.status(200).send()
}
chargeRefunded = function(req, res) {
  // console.log(JSON.stringify(req.body.data.object))
  // Lookup the Transaction record using the id of the charge object
  let charge = req.body.data.object
  Transaction.findOneAndUpdate(
    { trans_num: charge.id },
    { $set: { status: 'refunded', amount_refunded: charge.amount_refunded }},
    { new: true },
    function(err, transaction) {
      if (err) {
        // console.log("STRIPE WEBHOOK EVENT ERROR: refund.created error occurred: \n" + err)
      } else {
        // console.log("Transaction Updated to refunded")
    }
  });
  // Fire a socket event to update the client
  res.status(200).send()
}

exports.webhook = function(req, res) {
  // console.log("STRIPE WEBHOOK EVENT: ")
  // console.dir(req.body, {depth: null, colors: true})
  // let event_json = JSON.parse(req.body)
  // console.log("STRIPE WEBHOOK EVENT BODY: " + JSON.stringify(req.body.data.object))
  switch(req.body.type){
    case "customer.subscription.created":
      customerSubscriptionCreated(req, res)
      break
    case "customer.subscription.deleted":
      customerSubscriptionDeleted(req, res)
      break
    case "customer.subscription.trial_will_end":
      customerSubscriptionTrialWillEnd(req, res)
      break
    case "customer.subscription.updated":
      customerSubscriptionUpdated(req, res)
      break
    case "invoice.created":
      invoiceCreated(req, res)
      break
    case "invoice.payment_failed":
      invoicePaymentFailed(req, res)
      break
    case "invoice.payment_succeeded":
      invoicePaymentSucceeded(req, res)
      break
    case "invoice.sent":
      invoiceSent(req, res)
      break
    case "invoice.upcoming":
      invoiceUpcoming(req, res)
      break
    case "invoice.updated":
      invoiceUpdated(req, res)
      break
    case "charge.succeeded":
      chargeSucceeded(req, res)
      break
    case "charge.refunded":
      chargeRefunded(req, res)
      break
    default:
      res.status(200).send()
  }
}

exports.getCountries = function(req, res) {
  stripe.countrySpecs.list({limit: 100}, function(err, countrySpecs) {
    let countries = {}
    // console.dir(countrySpecs.data)
    if(countrySpecs.data != null){
      for(let i = 0; i < countrySpecs.data.length; ++i){
        // console.dir(countrySpecs.data[i])
        countries[countrySpecs.data[i].id] = countrySpecs.data[i]
      }
      // console.dir(countries)
      res.status(200).send(JSON.stringify(countries))
    } else {
      res.status(500).send({err: { message: "an internal server error occured while getting country data"}})
    }
  })
}
