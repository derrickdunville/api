'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    _         = require('lodash'),
    User      = mongoose.model('User'),
    Click     = mongoose.model('Click'),
    Commission = mongoose.model('Commission'),
    ip        = require('ip'),
    stripe    = require('stripe')("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT")

exports.me = function(req, res) {
    console.log("Getting me...")
    res.status(200).send(req.user);
};
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
  console.dir(req.body)
  if(req.user.stripe_acct_id == null){
    res.status(401).send()
  } else {
    res.status(200).send()
    // stripe.accounts.update(req.user.stripe_acct_id, {
    //     legal_entity: req.body.legal_entity,
    //   }).then(function(account, err){
    //   if(err){
    //     console.log("STRIPE - ERROR")
    //     console.dir(err)
    //     res.status(400).send({err: err})
    //   } else {
    //     console.log("STRIPE - Account Created")
    //     console.dir(account)
    //     res.status(201).send(account)
    //   }
    // }).catch(function(error) {
    //   console.log(error);
    //   res.status(500).send({err: error})
    // })
  }
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
