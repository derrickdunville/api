'use strict';
let mongoose  = require('mongoose'),
    mongodb   = require('mongodb'),
    config    = require('../config'),
    path      = require('path'),
    _         = require('lodash'),
    jwt       = require('jsonwebtoken'),
    ejwt      = require('express-jwt'),
    User      = mongoose.model('User'),
    waterfall = require('async-waterfall'),
    crypto    = require('crypto'),
    nodemailer = require('nodemailer'),
    AccessControl = require('accesscontrol'),
    mailers   = require('../mailers'),
    stripe    = require("stripe")("sk_test_K3Ol21vL7fiVAUDcp8MnOAYT"),
    AWS       = require('aws-sdk'),
    s3        = new AWS.S3({apiVersion: '2006-03-01', region: 'us-east-1'});

// exports.forgotPassword = function(req, res){
//   waterfall([
//     function(done){
//       if(!req.body.email) {
//         done({res_code: 400, err: {message: "You must provide an email"}})
//       } else {
//         // create a password recovery token
//         crypto.randomBytes(20, function(err, buf) {
//           let token = buf.toString('hex');
//           done(err, token)
//         });
//       }
//     },
//     function(token, done){
//       User.findOne({email: req.body.email})
//       .then(user => {
//         if(user == null){
//           done({res_code: 400, err: {message: "email address not found"}})
//         } else {
//           user.passwordResetToken = token;
//           user.passwordResetExpires = Date.now() + 3600000 // 1 hour
//           user.save()
//           .then(user => {
//             done(null, token, user);
//           }).catch(err => {
//             done(err)
//           });
//         }
//       }).catch(err => {
//         done(err)
//       })
//     },
//     function(token, user, done){
//       // Send Email to user
//       var transport = nodemailer.createTransport({
//         host: "gator4234.hostgator.com",
//         port: 465,
//         secure: true,
//         auth: {
//           user: "dev@ascendtrading.net",
//           pass: "4sc3ndD3v"
//         }
//       });
//       var mailOptions = {
//         to: user.email,
//         from: "dev@ascendtrading.net",
//         subject: "[Ascend Trading] Forgot Passowrd",
//         text: 'Hi ' + user.username + ',\n\n' +
//               'You are receiving this because you (or someone else) has requested the reset of the password for your account.\n\n' +
//               'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
//               'http://localhost:3000/reset-password/' + token + '\n\n' +
//               'If you did not request this, please ignore this email and your password will remain unchanged.\n'
//       };
//       transport.sendMail(mailOptions, function(err){
//         if (err){
//           done(err)
//         } else {
//           res.status(201).send({message: "Password reset email sent to " + user.email});
//         }
//       });
//     }
//   ],
//   function(err){
//     if(err.hasOwnProperty('res_code')){
//       res.status(err.res_code).send({err: err.err})
//     } else {
//       res.status(500).send({err: err})
//     }
//   })
// };
// exports.resetPassword = function(req, res) {
//   waterfall([
//     function(done){
//       if(!req.body.resetToken || !req.body.newPassword){
//         done({res_code: 400, err: {message: "you must provide password reset token and new password"}});
//       } else {
//         User.findOne({passwordResetToken: req.body.resetToken})
//         .then(user => {
//           if(user == null || (user.passwordResetExpires.getTime() < Date.now())){
//             done({res_code: 400, err: {message: "invalid or expired password reset token"}})
//           } else {
//             user.passwordResetToken = null;
//             user.passwordResetExpires = null;
//             user.password = req.body.newPassword;
//             user.save()
//             .then(updated_user => {
//               done(null, updated_user)
//             }).catch(err => {
//               done(err)
//             })
//           }
//         }).catch(err => {
//           done(err)
//         })
//       }
//     },
//     function(user, done){
//       // Send Email to user
//       var transport = nodemailer.createTransport({
//         host: "gator4234.hostgator.com",
//         port: 465,
//         secure: true,
//         auth: {
//           user: "dev@ascendtrading.net",
//           pass: "4sc3ndD3v"
//         }
//       });
//       var mailOptions = {
//         to: user.email,
//         from: "dev@ascendtrading.net",
//         subject: "[Ascend Trading] Passowrd successfully reset",
//         text: "Hi " + user.username + ",\n\n" +
//               "Your password was successfully changed.\n\n" +
//               "If you did not perform this password reset, your account may be compromised. " +
//               "Please contact Ascend Trading at contact@ascendtrading.net immediatly."
//
//       };
//       transport.sendMail(mailOptions, function(err){
//         if (err){
//           done(err)
//         } else {
//           res.status(201).send({message: "password successfully reset, email sent to " + user.email});
//         }
//       });
//     }
//   ],
//   function(err){
//     if(err.hasOwnProperty('res_code')){
//       res.status(err.res_code).send({err: err.err})
//     } else {
//       res.status(500).send({err: err})
//     }
//   })
// };
// exports.verifyPasswordResetToken = function(req, res){
//   if(!req.body.hasOwnProperty("resetToken") || req.body.resetToken === null){
//     res.status(400).send({err: {message: "must provide reset token"}});
//   } else {
//     User.findOne({passwordResetToken: req.body.resetToken}, function(err, user) {
//       if(err || user == null){
//         res.status(401).send({err: {message: "invalid reset token"}});
//       } else {
//         if(user.passwordResetExpires.getTime() < Date.now()){
//           res.status(401).send({err: {message: "exipred reset token"}});
//         } else {
//           res.status(201).send({message: "valid reset token"});
//         }
//       }
//     });
//   }
// };

exports.me = function(req, res){
  // console.log("getting me...")
  res.status(201).send(req.user)
}
exports.logoutUser = function(req, res){
  console.dir(req)
  User.findOneAndUpdate({_id: req.user._id}, {token: null, token_expires: null}, {runValidators: true, context: 'query', new: true})
  .then(user => {
    res.clearCookie("cookie")
    res.redirect(302, "/")
  }).catch(err => {
    res.status(500).send(err);
  })
}
exports.loginUser = function(req, res){
  if (!req.body.username || !req.body.password) {
    res.status(400).send({err: {message: "You must provide the username and password"}});
  } else {
    //lookup user by username
    //password should come hashed from the client application
    User.findOne({username: req.body.username})
    .then(user => {
      if(user == null || (user.password !== req.body.password)){
        res.status(400).send({err: {message: "username and password does not match"}});
      } else {
        // user exists and has provided correct password
        user.token = '';
        user.save()
        .then(empty_token_user => {
          // create new token for user
          empty_token_user.token = jwt.sign(empty_token_user, 'ascendtradingapi');
          empty_token_user.token_expires = Date.now() + (3600000*12) // 12 hours
          return empty_token_user.save()
        })
        .then(updated_token_user => {
          // send back a cookie with thier auth token
          let options = {
              maxAge: 1000 * 60 * 120, // would expire after 2 hours
              httpOnly: true, // The cookie only accessible by the web server
              // signed: true // Indicates if the cookie should be signed
          }
          // console.dir(updated_token_user)
          res.cookie('cookie', updated_token_user.token, options)
          res.status(201).send(updated_token_user);
        }).catch(err => {
          console.dir(err)

          res.status(500).send(err);
        })
      }
    }).catch(err => {
      res.status(500).send(err);
    })
  }
};
exports.listUsers = function(req, res) {
  let query = {}

  if(req.query.username !== undefined){
    query.username = {'$regex': req.query.username, '$options': 'i'}
  }
  if(req.query.email !== undefined){
    query.email = {'$regex': req.query.email, '$options': 'i'}
  }
  if(req.query.discord !== undefined){
    query.discord = {'$regex': req.query.discord, '$options': 'i'}
  }
  if(req.query.role !== undefined){
    query.roles = {'$in': [req.query.role]}
  }

  // Handle parsing sort
  let sort = {}
  if(req.query.sort !== undefined){
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

  User.paginate(query, options, function(err, users) {
    if(err){
      res.status(500).send(err)
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
      res.status(201).send(users);
    }
  });
};
exports.createUser = function(req, res) {
    // A user must provide
    // 1) username - unique
    // 2) password
    // 3) email - unique
    // User may have been referred by another user
    // Create a customer on stripe for the new user

    // check for a username, password, and email in the req body
    console.log("createUser...")
    if(!req.body.username || !req.body.password || !req.body.email) {
      res.status(400).send({message: "Must provide username, password, and email"});
    } else {
      // should be good to create the user
      let newUser = new User({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
      });
      newUser.save().then(user => {
        console.log("User created: ")
        console.dir(user)
        res.status(201).send(user);
      }).catch(err => {
        console.dir(err)
        res.status(500).send(err)
      })
    }
};
exports.readUser = function(req, res) {
  // Check the params
  if(!req.params.userId){
      res.status(400).send({message: "You must provide a userId"});
  } else {
    User.findOne({username: req.params.userId})
    .exec()
    .then(user => {
      if(user == null){
        res.status(404).send({message: "user not found"})
      } else {
        res.status(201).send(user);
      }
    }).catch(err => {
      res.status(500).send(err);
    })
  }
};
exports.updateUser = function(req, res) {
  User.findOneAndUpdate({_id: req.params.userId}, req.body, {runValidators: true, context: 'query', new: true})
  .then(user => {
    res.status(201).send(user);
  }).catch(err => {
    res.status(500).send(err);
  })
};
exports.deleteUser = function(req, res) {
  res.status(200).send();
};
