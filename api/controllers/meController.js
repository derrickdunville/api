'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    _         = require('lodash'),
    User      = mongoose.model('User'),
    Click     = mongoose.model('Click'),
    Commission = mongoose.model('Commission'),
    ip        = require('ip'),
    stripe    = require('stripe')("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT"),
    waterfall = require('async-waterfall')


exports.me = function(req, res) {
    console.log("Getting me...")
    res.status(200).send(req.user);
};
exports.myDiscordRoles = function(req, res){
  console.log("getting my roles...")
  // let user = User.findOne({_id: req.user._id})
  //   .populate({
  //     path: 'transactions',
  //     populate: {
  //       path: 'product',
  //       match: { category: 'membership' },
  //       select: 'discord_role_id'
  //     },
  //     match: {
  //       expires_at: { $gte: new Date()},
  //       status: 'succeeded'
  //     },
  //     select: 'product'
  //   })
  //   .select('transactions')
  //   .exec(function(err, user) {
  //     if(err){
  //       res.status(500).send()
  //     } else {
  //       let roles = []
  //       for(let i = 0; i < user.transactions.length; ++i){
  //         if(user.transactions[i].product.discord_role_id){
  //           roles.push(user.transactions[i].product.discord_role_id)
  //         }
  //       }
  //       res.status(200).send({roles: roles});
  //     }
  //   })

  User.findOne({_id: req.user._id})
    .exec(function(err, user){
      if(err){
        res.status(500).send()
      } else {
        let roles = user.getDiscordRoles()
        roles.then(roles => {
          console.log("roles: ")
          console.dir(roles)
          res.status(200).send({roles: roles})
        })
      }
    })
}
exports.myReferrals = function(req, res) {
    let query = User.find({referred_by: req.user._id}, 'username created_at')
    query.exec(function(err, users) {
      if(err){
        console.log(JSON.stringify(err))
        res.status(401).send({err:'Error getting referrals'})
      } else {
        res.status(201).send(users);
      }
    });
};
exports.myClicks = function(req, res) {
    let query = Click.find({referred_by: req.user._id}, '-referred_by')
    query.exec(function(err, clicks) {
      if(err){
        console.log(JSON.stringify(err))
        res.status(401).send({err:'Error getting clicks'})
      } else {
        res.status(201).send(clicks);
      }
    });
};
exports.myCommissions = function(req, res) {
    let query = Commission.find({user: req.user._id})
    query.exec(function(err, commissions) {
      if(err){
        console.log(JSON.stringify(err))
        res.status(401).send({err:'Error getting commissions'})
      } else {
        res.status(201).send(commissions);
      }
    });
};

exports.myReferralAccount = function(req, res) {
  if(req.user.stripe_acct_id == null){
    res.status(200).send(undefined)
  } else {
    stripe.accounts.retrieve(req.user.stripe_acct_id, function(err, account){
      if(err){
        console.log("STRIPE - ERROR RETRIEVING ACCOUNT")
        console.dir(err)
        res.status(400).send({err: err})
      } else {
        console.dir(account)
        res.status(200).send(account)
      }
    })
  }
};
exports.myReferralAccountBalance = function(req, res){
  if(req.user.stripe_acct_id == null){
    res.status(401).send(undefined)
  } else {
    stripe.balance.retrieve({
      stripe_account: req.user.stripe_acct_id
    }, function(err, balance){
      if(err){
        console.log("STRIPE - RETRIEVING BALANCE ERROR")
        console.dir(err)
        res.status(400).send({err: err})
      } else {
        console.log("STRIPE - BALANCE RETRIEVED")
        console.dir(balance)
        res.status(200).send(balance)
      }
    })
  }
}
exports.createReferralAccount = function(req, res) {
  console.dir(req.body)
  stripe.accounts.create({
    country: req.body.country,
    type: 'custom',
    email: req.user.email,
    legal_entity: req.body.legal_entity,
    tos_acceptance: {
      date: Math.round((new Date()).getTime() / 1000),
      ip: req.ip
    },
    statement_descriptor: "ASCEND TRADING",
    transfer_statement_descriptor: "ASCEND TRADING"
  }).then(function(account, err){
    if(err){
      console.log("STRIPE - ERROR")
      console.dir(err)
      console.dir(account)
      res.status(400).send({err: err})
    } else {
      console.log("STRIPE - Account Created")
      console.dir(account)
      // save the new stripe account id to the user - must know stripe account id to perform action on behalf of connected account
      let new_stripe_account_id = account.id
      User.findOneAndUpdate({_id: req.user._id}, {stripe_acct_id: new_stripe_account_id}, {new: true}, function(err, user) {
        if (err){
          console.log("USER - ERROR UPDATEING USER.STRIPE_ACCT_ID")
          console.dir(err)
          res.status(400).send({err: err})
        } else{
          console.log("Updated User: " + JSON.stringify(user))
          // let filteredUser = readPermission.filter(JSON.parse(JSON.stringify(user)))
          // console.log("Filtered User: " + JSON.stringify(filteredUser))
          // req.app.io.sockets.emit('user-updated', filteredUser)
          delete account.keys
          res.status(201).send(account)
        }
      });
    }
  })
}

exports.updateReferralAccount = function(req, res) {
  console.dir(req.files)
  console.dir(req.body)
  waterfall([
    function(done){
      // validation of user account and form-data
      if(req.user.stripe_acct_id == null){
        console.log("no referral account")
        done({message: "no referral account", code: 401}, null)
      } else {
        done(null, req.user.stripe_acct_id)
      }
    },
    function(stripe_acct_id, done){
      let front
      if(req.files['identity_document_front'] != undefined){
        console.log("contains identity_document_front")
        console.dir(req.files['identity_document_front'][0])
        let identity_document_front = req.files['identity_document_front'][0] // only 1 in the list
        // handle uploading files to stripe
        stripe.fileUploads.create({
          purpose: 'identity_document',
          file: {
            data: identity_document_front.buffer,
            name: identity_document_front.originalname,
            type: 'application/octet-stream'
          }
        }, function(err, fileUpload){
          console.dir(fileUpload)
          front = fileUpload
          done(null, stripe_acct_id, front)
        }).catch(function(error) {
          console.log(error);
          done({message: error, code: 500}, null)
          return
        })
      } else {
        console.log("does not contain identity_document_front")
        done(null, stripe_acct_id, null)
      }
    },
    function(stripe_acct_id, front, done){
      let back
      if(req.files['identity_document_back'] != undefined){
        console.log("contains identity_document_back")
        console.dir(req.files['identity_document_back'][0])
        let identity_document_back = req.files['identity_document_back'][0] // only 1 in the list
        // handle uploading files to stripe
        stripe.fileUploads.create({
          purpose: 'identity_document',
          file: {
            data: identity_document_back.buffer,
            name: identity_document_back.originalname,
            type: 'application/octet-stream'
          }
        }, function(err, fileUpload){
          console.dir(fileUpload)
          back = fileUpload
          done(null, stripe_acct_id, front, back)
        }).catch(function(error) {
          console.log(error);
          done({message: error, code: 500}, null)
        })
      } else {
        console.log("does not contain identity_document_back")
        done(null, stripe_acct_id, front, null)
      }
    },
    function(stripe_acct_id, front, back, done){
      var referralAccount = JSON.parse(req.body.referralAccount)
      console.dir(referralAccount.legal_entity)
      var verification = {
        document: null,
        document_back: null
      }
      if(front != null){
        verification.document = front.id
      } else {
        delete verification.document
      }
      if(back != null){
        verification.document_back = back.id
      } else {
        delete verification.document_back
      }
      if(front != null || back != null){
        referralAccount.legal_entity.verification = {}
        referralAccount.legal_entity.verification = verification
      }

      stripe.accounts.update(stripe_acct_id, {
          legal_entity: referralAccount.legal_entity,
        }).then(function(account, err){
        if(err){
          console.log("STRIPE - ERROR")
          console.dir(err)
          done({message: err, code: 400}, null)
        } else {
          console.log("STRIPE - Account Created")
          console.dir(account)
          done(null, account)
        }
      }).catch(function(error) {
        console.log(error);
        done({message: error, code: 500}, null)
      })
    }
  ],
  function(err, account){
    if (err != null) {
      res.status(err.code).send(err.message);
    } else {
      res.status(201).send(account)
    }
  });
}

exports.updateBankAccount = function(req, res) {
  console.dir(req.body)
  if(req.user.stripe_acct_id == null){
    res.status(401).send()
  } else {
    stripe.accounts.update(req.user.stripe_acct_id, {
        external_account: req.body.id
      }).then(function(account, err){
      if(err){
        console.log("STRIPE - ERROR")
        console.dir(err)
        res.status(400).send({err: err})
      } else {
        console.log("STRIPE - external account updated")
        console.dir(account)
        res.status(201).send(account)
      }
    }).catch(function(error) {
      console.log(error);
      res.status(500).send({err: error})
    })
  }
}
exports.myPaymentMethod = function(req, res){
  console.log("Getting Payment Method...")
  console.dir(req.body)
  // how do we handle updating payment method for connect customers
  if(req.user.stripe_cus_id == null){
    res.status(401).send({err: "No stripe account to add payment method to"})
  } else {
    stripe.customers.retrieve(req.user.stripe_cus_id, function(err, customer){
      if(err){
        console.log("STRIPE - ERROR")
        console.dir(err)
        res.status(400).send({err: err})
      } else {
        console.log("STRIPE - customer retieved")
        console.dir(customer)
        stripe.customers.retrieveCard(
          customer.id,
          customer.default_source,
          function(err, card) {
            if(err){
              console.log("STRIPE - ERROR getting default source")
              console.dir(err)
              res.status(400).send({err: err})
            } else {
              console.log("STRIPE - default source loaded")
              console.dir(card)
              res.status(200).send(card)
            }
          }
        );
      }
    }).catch(function(error) {
      console.log(error);
      res.status(500).send({err: error})
    })
  }
}
exports.updateMyPaymentMethod = function(req, res){
  console.log("Updating Payment Method...")
  console.dir(req.body)
  // how do we handle updating payment method for connect customers
  if(req.user.stripe_cus_id == null){
    res.status(401).send({err: "No stripe account to add payment method to"})
  } else {
    stripe.customers.update(req.user.stripe_cus_id, {
        source: req.body.stripe_source_token
      }).then(function(customer, err){
      if(err){
        console.log("STRIPE - ERROR")
        console.dir(err)
        res.status(400).send({err: err})
      } else {
        console.log("STRIPE - default source updated")
        console.dir(customer)
        stripe.customers.retrieveCard(
          customer.id,
          customer.default_source,
          function(err, card) {
            if(err){
              console.log("STRIPE - ERROR getting default source")
              console.dir(err)
              res.status(400).send({err: err})
            } else {
              console.log("STRIPE - default source updated")
              console.dir(card)
              res.status(201).send(card)
            }
          }
        );
      }
    }).catch(function(error) {
      console.log(error);
      res.status(500).send({err: error})
    })
  }
}
